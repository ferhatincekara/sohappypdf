import { describe, expect, test } from "bun:test";
import {
  type BillingService,
  createTestBillingService,
  DEFAULT_PLAN_LIMITS,
} from "@sohappypdf/billing";
import {
  type ConversionRecord,
  type ConversionRepository,
  createConversionService,
  isConversionRecordExpired,
} from "@sohappypdf/conversions";
import { APP_ERROR_CODES } from "@sohappypdf/core";
import {
  createFileService,
  type FileRecord,
  type FileRepository,
  type FileService,
  sumActiveStorageBytesForOwner,
} from "@sohappypdf/files";
import type { Logger } from "@sohappypdf/logger";
import type { ConversionJobData } from "@sohappypdf/queue";
import type { Storage } from "@sohappypdf/storage";
import { createApp } from "../../app.js";
import type { RequestIdentity } from "../../auth/request-identity.js";

const silentLogger: Logger = {
  level: "error",
  error() {},
  warn() {},
  info() {},
  debug() {},
  child() {
    return silentLogger;
  },
};

function createMemoryFileRepository(seed: FileRecord[] = []): FileRepository {
  const records = new Map<string, FileRecord>(
    seed.map((file) => [file.id, { ...file }]),
  );

  return {
    async insert(file) {
      records.set(file.id, { ...file });
      return { ...file };
    },
    async findById(id) {
      const file = records.get(id);
      return file === undefined ? undefined : { ...file };
    },
    async listByOwner() {
      return [];
    },
    async updateStatus(input) {
      const file = records.get(input.id);

      if (file === undefined || file.status !== input.from) {
        return undefined;
      }

      const updated = { ...file, status: input.to, updatedAt: input.now };
      records.set(input.id, updated);
      return { ...updated };
    },
    async markDeleted(input) {
      const file = records.get(input.id);

      if (file === undefined) {
        return undefined;
      }

      const updated = {
        ...file,
        status: "deleted" as const,
        deletedAt: input.now,
        updatedAt: input.now,
      };
      records.set(input.id, updated);
      return { ...updated };
    },
    async deleteById(id) {
      records.delete(id);
    },
    async markPurged() {
      return undefined;
    },
    async listEligibleForCleanup() {
      return [];
    },
    async listPurged() {
      return [];
    },
    async sumActiveStorageBytes(ownerId, now) {
      return sumActiveStorageBytesForOwner([...records.values()], ownerId, now);
    },
    async transferOwner(input) {
      let transferred = 0;

      for (const [id, file] of records.entries()) {
        if (
          file.ownerId !== input.fromOwnerId ||
          (file.ownerKind ?? "user") !== input.fromOwnerKind
        ) {
          continue;
        }

        records.set(id, {
          ...file,
          ownerId: input.toOwnerId,
          ownerKind: input.toOwnerKind,
          updatedAt: input.now,
        });
        transferred += 1;
      }

      return { transferred };
    },
  };
}

function createMemoryStorage(): Storage {
  const objects = new Map<string, { contentLength: number }>();

  return {
    async uploadObject(input) {
      objects.set(input.key, { contentLength: input.body.byteLength });
      return { key: input.key };
    },
    async uploadObjectFromFile(input) {
      objects.set(input.key, { contentLength: 1 });
      return { key: input.key };
    },
    async downloadObjectToFile(input) {
      return { key: input.key, sizeBytes: 0 };
    },
    async ping() {},
    async createPresignedUploadUrl(input) {
      return {
        key: input.key,
        expiresInSeconds: input.expiresInSeconds ?? 900,
        url: `https://example.invalid/${input.key}`,
      };
    },
    async createPresignedDownloadUrl(input) {
      return {
        key: input.key,
        expiresInSeconds: 900,
        url: `https://example.invalid/${input.key}`,
      };
    },
    async deleteObject(key) {
      objects.delete(key);
    },
    async objectExists(key) {
      return objects.has(key);
    },
    async getObject(key) {
      return { key, body: new Uint8Array() };
    },
    async getObjectMetadata(key) {
      const object = objects.get(key);
      return object === undefined
        ? undefined
        : { key, contentLength: object.contentLength };
    },
  };
}

function createMemoryConversionRepository(
  seed: ConversionRecord[] = [],
): ConversionRepository {
  const records = new Map<string, ConversionRecord>(
    seed.map((conversion) => [conversion.id, { ...conversion }]),
  );

  return {
    async insert(conversion) {
      records.set(conversion.id, { ...conversion });
      return { ...conversion };
    },
    async findById(id) {
      const conversion = records.get(id);
      return conversion === undefined ? undefined : { ...conversion };
    },
    async findByIdempotencyKey(ownerId, key) {
      const conversion = [...records.values()].find(
        (item) => item.ownerId === ownerId && item.idempotencyKey === key,
      );
      return conversion === undefined ? undefined : { ...conversion };
    },
    async listByOwner(input) {
      return [...records.values()]
        .filter((conversion) => {
          if (conversion.ownerId !== input.ownerId) {
            return false;
          }

          if (
            input.ownerKind !== undefined &&
            conversion.ownerKind !== input.ownerKind
          ) {
            return false;
          }

          if (
            input.now !== undefined &&
            isConversionRecordExpired(conversion, input.now)
          ) {
            return false;
          }

          if (
            input.status !== undefined &&
            conversion.status !== input.status
          ) {
            return false;
          }

          if (
            input.targetFormat !== undefined &&
            conversion.targetFormat !== input.targetFormat
          ) {
            return false;
          }

          if (input.cursor === undefined) {
            return true;
          }

          if (
            conversion.createdAt.getTime() < input.cursor.createdAt.getTime()
          ) {
            return true;
          }

          return (
            conversion.createdAt.getTime() ===
              input.cursor.createdAt.getTime() &&
            conversion.id < input.cursor.id
          );
        })
        .sort((left, right) => {
          const created = right.createdAt.getTime() - left.createdAt.getTime();
          return created === 0 ? right.id.localeCompare(left.id) : created;
        })
        .slice(0, input.limit)
        .map((conversion) => ({ ...conversion }));
    },
    async updateStatus(input) {
      const conversion = records.get(input.id);

      if (conversion === undefined || conversion.status !== input.from) {
        return undefined;
      }

      const updated: ConversionRecord = {
        ...conversion,
        status: input.to,
        updatedAt: input.now,
        queuedAt: input.to === "queued" ? input.now : conversion.queuedAt,
        startedAt: input.to === "processing" ? input.now : conversion.startedAt,
        completedAt:
          input.to === "completed" ||
          input.to === "failed" ||
          input.to === "cancelled"
            ? input.now
            : conversion.completedAt,
        outputFileId:
          input.outputFileId === undefined
            ? conversion.outputFileId
            : input.outputFileId,
        errorCode:
          input.errorCode === undefined
            ? conversion.errorCode
            : input.errorCode,
        errorMessage:
          input.errorMessage === undefined
            ? conversion.errorMessage
            : input.errorMessage,
      };
      records.set(input.id, updated);
      return { ...updated };
    },
    async deleteById(id) {
      records.delete(id);
    },
    async deleteReferencingFile(fileId) {
      let deleted = 0;

      for (const [id, conversion] of [...records.entries()]) {
        if (
          conversion.sourceFileId === fileId ||
          conversion.outputFileId === fileId
        ) {
          records.delete(id);
          deleted += 1;
        }
      }

      return deleted;
    },
    async listExpired(input) {
      return [...records.values()]
        .filter((conversion) =>
          isConversionRecordExpired(conversion, input.now),
        )
        .slice(0, input.limit)
        .map((conversion) => ({ ...conversion }));
    },
    async transferOwner(input) {
      let transferred = 0;

      for (const [id, conversion] of records.entries()) {
        if (
          conversion.ownerId !== input.fromOwnerId ||
          (conversion.ownerKind ?? "user") !== input.fromOwnerKind
        ) {
          continue;
        }

        records.set(id, {
          ...conversion,
          ownerId: input.toOwnerId,
          ownerKind: input.toOwnerKind,
          updatedAt: input.now,
        });
        transferred += 1;
      }

      return { transferred };
    },
  };
}

type TestServices = {
  fileService: FileService;
  storage: Storage;
  jobs: ConversionJobData[];
  failEnqueue: boolean;
  billingService: BillingService;
  createAppFor(identity: RequestIdentity): ReturnType<typeof createApp>;
};

function createConversionServices(
  now?: () => Date,
  billingService?: BillingService,
): TestServices {
  const jobs: ConversionJobData[] = [];
  const storage = createMemoryStorage();
  const fileService = createFileService({
    repository: createMemoryFileRepository(),
    storage,
    now,
  });
  const conversionService = createConversionService({
    repository: createMemoryConversionRepository(),
    files: fileService,
    now,
  });
  const billing = billingService ?? createTestBillingService();
  const services: TestServices = {
    jobs,
    fileService,
    storage,
    failEnqueue: false,
    billingService: billing,
    createAppFor(identity) {
      return createApp({
        config: { corsOrigins: [] },
        logger: silentLogger,
        resolveIdentity: async () => identity,
        fileService,
        conversionService,
        billingService: billing,
        enqueueConversion: async (input) => {
          if (services.failEnqueue) {
            throw new Error("redis unavailable");
          }

          jobs.push(input);
          return {
            jobId: input.conversionId,
            conversionId: input.conversionId,
          };
        },
      });
    },
  };

  return services;
}

function createConversionApp(options: {
  identity: RequestIdentity;
  now?: () => Date;
  billingService?: BillingService;
}) {
  const services = createConversionServices(
    options.now,
    options.billingService,
  );
  return Object.assign(services, {
    app: services.createAppFor(options.identity),
  });
}

async function createReadyFile(
  services: Pick<TestServices, "fileService" | "storage">,
  input: {
    ownerId: string;
    filename?: string;
    contentType?: string;
  },
): Promise<FileRecord> {
  const created = await services.fileService.createUploadIntent({
    ownerId: input.ownerId,
    originalFilename: input.filename ?? "report.pdf",
    mimeType: input.contentType ?? "application/pdf",
    sizeBytes: 2048,
  });
  await services.storage.uploadObject({
    key: created.file.objectKey,
    body: new Uint8Array(created.file.sizeBytes),
    contentType: created.file.mimeType,
  });
  return services.fileService.completeUpload(created.file.id, input.ownerId);
}

const sessionIdentity: RequestIdentity = {
  kind: "session",
  userId: "user_1",
  sessionId: "session_1",
};

const apiKeyIdentity: RequestIdentity = {
  kind: "api-key",
  userId: "user_1",
  apiKeyId: "key_1",
};

describe("conversion API", () => {
  test("requires authentication for conversion routes", async () => {
    const { app } = createConversionApp({ identity: { kind: "anonymous" } });
    const response = await app.request("/v1/conversions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceFileId: "550e8400-e29b-41d4-a716-446655440000",
        targetFormat: "jpg",
      }),
    });

    expect(response.status).toBe(401);
  });

  test("creates a queued conversion for a session user", async () => {
    const context = createConversionApp({
      identity: sessionIdentity,
      now: () => new Date("2026-08-23T18:30:00.000Z"),
    });
    const file = await createReadyFile(context, { ownerId: "user_1" });

    const response = await context.app.request("/v1/conversions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceFileId: file.id,
        targetFormat: "jpg",
        userId: "forged_user",
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.conversion.status).toBe("queued");
    expect(body.conversion.sourceFileId).toBe(file.id);
    expect(body.conversion.sourceFilename).toBe(file.originalFilename);
    expect(body.conversion.targetFormat).toBe("jpg");
    expect(body.conversion.type).toBe("pdf-to-jpg");
    expect(JSON.stringify(body)).not.toContain("objectKey");
    expect(JSON.stringify(body)).not.toContain("jobId");
    expect(context.jobs).toEqual([
      {
        conversionId: body.conversion.id,
        sourceFileId: file.id,
        sourceObjectKey: file.objectKey,
        conversionType: "pdf-to-jpg",
        sourceFormat: "pdf",
        targetFormat: "jpg",
        options: { type: "pdf-to-jpg" },
      },
    ]);
  });

  test("allows API-key identities to create conversions for their owner", async () => {
    const context = createConversionApp({
      identity: apiKeyIdentity,
      billingService: createTestBillingService({
        apiCreditGrants: { user_1: 100 },
      }),
    });
    const file = await createReadyFile(context, {
      ownerId: "user_1",
      filename: "image.png",
      contentType: "image/png",
    });

    const response = await context.app.request("/v1/conversions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceFileId: file.id,
        targetFormat: "pdf",
      }),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      conversion: { type: "png-to-pdf", status: "queued" },
    });
  });

  test("rejects another user's file without revealing that it exists", async () => {
    const services = createConversionServices();
    const ownerApp = services.createAppFor(sessionIdentity);
    const otherApp = services.createAppFor({
      kind: "session",
      userId: "user_2",
      sessionId: "session_2",
    });
    const file = await createReadyFile(services, { ownerId: "user_1" });

    const response = await otherApp.request("/v1/conversions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceFileId: file.id,
        targetFormat: "jpg",
      }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      error: { code: APP_ERROR_CODES.NOT_FOUND, message: "File not found" },
    });
    expect((await ownerApp.request("/v1/conversions")).status).toBe(200);
  });

  test("rejects expired and deleted source files", async () => {
    let currentTime = new Date("2026-08-23T18:00:00.000Z");
    const context = createConversionApp({
      identity: sessionIdentity,
      now: () => currentTime,
    });
    const expired = await createReadyFile(context, {
      ownerId: "user_1",
      filename: "expired.pdf",
    });
    const deleted = await createReadyFile(context, {
      ownerId: "user_1",
      filename: "deleted.pdf",
    });
    await context.fileService.deleteOwnedFile(deleted.id, "user_1");

    const deletedResponse = await context.app.request("/v1/conversions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceFileId: deleted.id,
        targetFormat: "jpg",
      }),
    });

    currentTime = new Date("2026-08-23T21:00:00.000Z");

    const expiredResponse = await context.app.request("/v1/conversions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceFileId: expired.id,
        targetFormat: "jpg",
      }),
    });

    expect(expiredResponse.status).toBe(410);
    expect(await expiredResponse.json()).toMatchObject({
      error: {
        code: APP_ERROR_CODES.FILE_EXPIRED,
        message: "This file has expired. Please process it again.",
      },
    });
    expect(deletedResponse.status).toBe(404);
  });

  test("rejects a source file that is not ready", async () => {
    const { app, fileService } = createConversionApp({
      identity: sessionIdentity,
    });
    const pending = await fileService.createUploadIntent({
      ownerId: "user_1",
      originalFilename: "pending.pdf",
      mimeType: "application/pdf",
      sizeBytes: 2048,
    });

    const response = await app.request("/v1/conversions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceFileId: pending.file.id,
        targetFormat: "jpg",
      }),
    });

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: {
        code: APP_ERROR_CODES.CONFLICT,
        message: "Source file unavailable",
      },
    });
  });

  test("rejects invalid identifiers, formats, and malformed bodies", async () => {
    const { app } = createConversionApp({ identity: sessionIdentity });

    const invalidId = await app.request("/v1/conversions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceFileId: "not-a-uuid",
        targetFormat: "jpg",
      }),
    });
    const unsupported = await app.request("/v1/conversions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceFileId: "550e8400-e29b-41d4-a716-446655440000",
        targetFormat: "exe",
      }),
    });
    const malformed = await app.request("/v1/conversions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });

    expect(invalidId.status).toBe(400);
    expect(unsupported.status).toBe(400);
    expect(malformed.status).toBe(400);
  });

  test("replays a matching Idempotency-Key for the same user", async () => {
    const context = createConversionApp({ identity: sessionIdentity });
    const file = await createReadyFile(context, { ownerId: "user_1" });
    const headers = {
      "content-type": "application/json",
      "Idempotency-Key": "convert-report-1",
    };
    const body = JSON.stringify({
      sourceFileId: file.id,
      targetFormat: "jpg",
    });

    const first = await context.app.request("/v1/conversions", {
      method: "POST",
      headers,
      body,
    });
    const firstBody = await first.json();
    const second = await context.app.request("/v1/conversions", {
      method: "POST",
      headers,
      body,
    });
    const secondBody = await second.json();

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(secondBody.conversion.id).toBe(firstBody.conversion.id);
    expect(context.jobs).toHaveLength(1);
  });

  test("rejects a reused Idempotency-Key with a different payload", async () => {
    const context = createConversionApp({ identity: sessionIdentity });
    const file = await createReadyFile(context, { ownerId: "user_1" });

    await context.app.request("/v1/conversions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Idempotency-Key": "convert-report-1",
      },
      body: JSON.stringify({
        sourceFileId: file.id,
        targetFormat: "jpg",
      }),
    });
    const response = await context.app.request("/v1/conversions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Idempotency-Key": "convert-report-1",
      },
      body: JSON.stringify({
        sourceFileId: file.id,
        targetFormat: "png",
      }),
    });

    expect(response.status).toBe(409);
  });

  test("marks the conversion failed when enqueueing fails", async () => {
    const context = createConversionApp({ identity: sessionIdentity });
    const file = await createReadyFile(context, { ownerId: "user_1" });
    context.failEnqueue = true;

    const response = await context.app.request("/v1/conversions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceFileId: file.id,
        targetFormat: "jpg",
      }),
    });

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({
      error: {
        code: APP_ERROR_CODES.INTERNAL_ERROR,
        message: "Conversion could not be queued",
      },
    });

    context.failEnqueue = false;
    const replay = await context.app.request("/v1/conversions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Idempotency-Key": "after-failure",
      },
      body: JSON.stringify({
        sourceFileId: file.id,
        targetFormat: "jpg",
      }),
    });

    expect(replay.status).toBe(201);
  });

  test("returns only the owner's conversion on get and list", async () => {
    const services = createConversionServices();
    const ownerApp = services.createAppFor(sessionIdentity);
    const otherApp = services.createAppFor({
      kind: "session",
      userId: "user_2",
      sessionId: "session_2",
    });
    const ownerFile = await createReadyFile(services, { ownerId: "user_1" });
    const otherFile = await createReadyFile(services, { ownerId: "user_2" });
    const created = await ownerApp.request("/v1/conversions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceFileId: ownerFile.id,
        targetFormat: "jpg",
      }),
    });
    const createdBody = await created.json();
    await otherApp.request("/v1/conversions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceFileId: otherFile.id,
        targetFormat: "jpg",
      }),
    });

    const getOwn = await ownerApp.request(
      `/v1/conversions/${createdBody.conversion.id}`,
    );
    const getOther = await otherApp.request(
      `/v1/conversions/${createdBody.conversion.id}`,
    );
    const listed = await ownerApp.request("/v1/conversions");
    const listedBody = await listed.json();

    expect(getOwn.status).toBe(200);
    expect(getOther.status).toBe(404);
    expect(listed.status).toBe(200);
    expect(listedBody.conversions).toHaveLength(1);
    expect(listedBody.conversions[0].id).toBe(createdBody.conversion.id);
    expect(listedBody.conversions[0].sourceFilename).toBeString();
  });

  test("paginates conversion lists and rejects oversized pages", async () => {
    const context = createConversionApp({ identity: sessionIdentity });
    const first = await createReadyFile(context, {
      ownerId: "user_1",
      filename: "one.pdf",
    });
    const second = await createReadyFile(context, {
      ownerId: "user_1",
      filename: "two.pdf",
    });

    await context.app.request("/v1/conversions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sourceFileId: first.id, targetFormat: "jpg" }),
    });
    await context.app.request("/v1/conversions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sourceFileId: second.id, targetFormat: "png" }),
    });

    const tooLarge = await context.app.request("/v1/conversions?limit=1000000");
    const page = await context.app.request("/v1/conversions?limit=1");
    const pageBody = await page.json();
    const next = await context.app.request(
      `/v1/conversions?limit=1&cursor=${pageBody.nextCursor}`,
    );

    expect(tooLarge.status).toBe(400);
    expect(page.status).toBe(200);
    expect(pageBody.conversions).toHaveLength(1);
    expect(pageBody.nextCursor).toBeString();
    expect((await next.json()).conversions).toHaveLength(1);
  });

  test("cancels a queued conversion owned by the caller", async () => {
    const context = createConversionApp({ identity: sessionIdentity });
    const file = await createReadyFile(context, { ownerId: "user_1" });
    const created = await context.app.request("/v1/conversions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceFileId: file.id,
        targetFormat: "jpg",
      }),
    });
    const createdBody = await created.json();

    const response = await context.app.request(
      `/v1/conversions/${createdBody.conversion.id}/cancel`,
      { method: "POST" },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      conversion: {
        id: createdBody.conversion.id,
        status: "cancelled",
        error: { code: "cancelled" },
      },
    });
  });

  test("rejects a new conversion after the monthly web credit limit", async () => {
    const context = createConversionApp({
      identity: sessionIdentity,
      billingService: createTestBillingService({
        planCatalog: {
          ...DEFAULT_PLAN_LIMITS,
          free: {
            ...DEFAULT_PLAN_LIMITS.free,
            monthlyWebCredits: 1,
          },
        },
      }),
    });
    const file = await createReadyFile(context, { ownerId: "user_1" });

    const first = await context.app.request("/v1/conversions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceFileId: file.id,
        targetFormat: "jpg",
      }),
    });
    const second = await context.app.request("/v1/conversions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceFileId: file.id,
        targetFormat: "png",
      }),
    });

    expect(first.status).toBe(201);
    expect(second.status).toBe(403);
    expect(await second.json()).toMatchObject({
      error: { code: APP_ERROR_CODES.PLAN_LIMIT_REACHED },
    });
  });

  test("records daily usage even when credit consume fails after enqueue", async () => {
    const inner = createTestBillingService();
    const billingService: BillingService = {
      ...inner,
      async consumeWebCredits() {
        throw new Error("credit ledger unavailable");
      },
    };
    const context = createConversionApp({
      identity: sessionIdentity,
      billingService,
    });
    const file = await createReadyFile(context, { ownerId: "user_1" });

    const response = await context.app.request("/v1/conversions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceFileId: file.id,
        targetFormat: "jpg",
      }),
    });
    const status = await billingService.getBillingStatus({
      userId: "user_1",
      storageUsedBytes: 0,
      apiKeyCount: 0,
    });

    expect(response.status).toBe(201);
    expect(status.usage.conversionsUsed).toBe(1);
  });

  test("records conversion usage once and enforces the monthly conversion limit", async () => {
    const context = createConversionApp({
      identity: sessionIdentity,
      billingService: createTestBillingService({
        planCatalog: {
          ...DEFAULT_PLAN_LIMITS,
          free: {
            ...DEFAULT_PLAN_LIMITS.free,
            monthlyConversions: 1,
          },
        },
      }),
    });
    const file = await createReadyFile(context, { ownerId: "user_1" });

    const first = await context.app.request("/v1/conversions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceFileId: file.id,
        targetFormat: "jpg",
      }),
    });
    const second = await context.app.request("/v1/conversions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceFileId: file.id,
        targetFormat: "png",
      }),
    });
    const usage = await context.billingService.getConversionUsage("user_1");

    expect(first.status).toBe(201);
    expect(second.status).toBe(403);
    expect(await second.json()).toMatchObject({
      error: { code: APP_ERROR_CODES.PLAN_LIMIT_REACHED },
    });
    expect(usage.conversionsUsed).toBe(1);
  });

  test("allows an API-key conversion using included API credits", async () => {
    const context = createConversionApp({
      identity: apiKeyIdentity,
      billingService: createTestBillingService(),
    });
    const file = await createReadyFile(context, {
      ownerId: "user_1",
      filename: "image.png",
      contentType: "image/png",
    });

    const response = await context.app.request("/v1/conversions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceFileId: file.id,
        targetFormat: "pdf",
      }),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      conversion: { type: "png-to-pdf", status: "queued" },
    });
  });

  test("rejects a Pro-only tool for a Free session user", async () => {
    const context = createConversionApp({
      identity: sessionIdentity,
    });
    const file = await createReadyFile(context, { ownerId: "user_1" });

    const response = await context.app.request("/v1/conversions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceFileId: file.id,
        targetFormat: "pdf",
        type: "ocr-pdf",
      }),
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: {
        code: APP_ERROR_CODES.PLAN_LIMIT_REACHED,
        message: "This tool requires Pro",
      },
    });
    expect(context.jobs).toHaveLength(0);
  });
});
