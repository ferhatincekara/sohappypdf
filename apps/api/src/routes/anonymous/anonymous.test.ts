import { describe, expect, test } from "bun:test";
import {
  ANONYMOUS_SESSION_COOKIE_NAME,
  createAnonymousSessionService,
  createMemoryAnonymousSessionRepository,
} from "@repo/auth";
import { createTestBillingService } from "@repo/billing";
import { DEFAULT_ANONYMOUS_CONFIG } from "@repo/config";
import {
  type ConversionRecord,
  type ConversionRepository,
  createConversionService,
} from "@repo/conversions";
import { APP_ERROR_CODES } from "@repo/core";
import {
  createFileService,
  type FileRecord,
  type FileRepository,
  type FileService,
  sumActiveStorageBytesForOwner,
} from "@repo/files";
import type { Logger } from "@repo/logger";
import type { ConversionJobData } from "@repo/queue";
import type { RateLimitDecision, RateLimitSubject } from "@repo/rate-limit";
import type { Storage } from "@repo/storage";
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

const uploadBody = {
  filename: "report.pdf",
  contentType: "application/pdf",
  size: 2048,
};

const allowed: RateLimitDecision = {
  allowed: true,
  failedOpen: false,
  kind: "anonymous",
  limit: 30,
  remaining: 29,
  resetAtMs: 1_700_000_010_000,
};

const denied: RateLimitDecision = {
  allowed: false,
  failedOpen: false,
  kind: "anonymous",
  limit: 10,
  remaining: 0,
  resetAtMs: 1_700_000_010_000,
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
    async listEligibleForCleanup() {
      return [];
    },
    async sumActiveStorageBytes(ownerId, now) {
      return sumActiveStorageBytesForOwner([...records.values()], ownerId, now);
    },
  };
}

function createMemoryStorage(): Storage & {
  objects: Map<string, { contentLength: number }>;
} {
  const objects = new Map<string, { contentLength: number }>();

  return {
    objects,
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
    async listByOwner() {
      return [];
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
  };
}

function cookieFrom(response: Response): string {
  const cookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [];

  if (cookies.length > 0) {
    return cookies
      .map((value) => value.split(";")[0])
      .filter((value): value is string => value !== undefined)
      .join("; ");
  }

  const header = response.headers.get("set-cookie");
  return header?.split(";")[0] ?? "";
}

function createAnonymousApp(options?: {
  identity?: RequestIdentity;
  now?: () => Date;
  checkRateLimit?: (subject: RateLimitSubject) => Promise<RateLimitDecision>;
  checkAnonymousOperationRateLimit?: (
    subject: RateLimitSubject,
  ) => Promise<RateLimitDecision>;
}) {
  const storage = createMemoryStorage();
  const fileService = createFileService({
    repository: createMemoryFileRepository(),
    storage,
    now: options?.now,
  });
  const conversionService = createConversionService({
    repository: createMemoryConversionRepository(),
    files: fileService,
    now: options?.now,
  });
  const jobs: ConversionJobData[] = [];
  const app = createApp({
    config: { corsOrigins: [] },
    logger: silentLogger,
    resolveIdentity: async () => options?.identity ?? { kind: "anonymous" },
    anonymousSessionService: createAnonymousSessionService({
      repository: createMemoryAnonymousSessionRepository(),
      retentionMs: DEFAULT_ANONYMOUS_CONFIG.retentionMs,
      now: options?.now,
    }),
    anonymousConfig: DEFAULT_ANONYMOUS_CONFIG,
    fileService,
    conversionService,
    billingService: createTestBillingService(),
    checkRateLimit: options?.checkRateLimit,
    checkAnonymousOperationRateLimit: options?.checkAnonymousOperationRateLimit,
    enqueueConversion: async (input) => {
      jobs.push(input);
      return { jobId: input.conversionId, conversionId: input.conversionId };
    },
  });

  return { app, fileService, conversionService, storage, jobs };
}

async function uploadAnonymousFile(
  app: ReturnType<typeof createApp>,
  cookie?: string,
) {
  const response = await app.request("/api/v1/anonymous/files/upload", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(cookie === undefined ? {} : { cookie }),
    },
    body: JSON.stringify(uploadBody),
  });
  const body = await response.json();
  const nextCookie = cookieFrom(response) || cookie || "";

  return { response, body, cookie: nextCookie };
}

async function completeAnonymousFile(
  app: ReturnType<typeof createApp>,
  fileService: FileService,
  storage: ReturnType<typeof createMemoryStorage>,
  fileId: string,
  cookie: string,
  ownerId: string,
) {
  const file = await fileService.getOwnedFile(fileId, ownerId);
  await storage.uploadObject({
    key: file.objectKey,
    body: new Uint8Array(file.sizeBytes),
    contentType: file.mimeType,
  });

  return app.request(`/api/v1/anonymous/files/${fileId}/complete`, {
    method: "POST",
    headers: { cookie },
  });
}

describe("anonymous tool API", () => {
  test("uploads, processes, and downloads without signup", async () => {
    const { app, fileService, storage, jobs } = createAnonymousApp();
    const uploaded = await uploadAnonymousFile(app);

    expect(uploaded.response.status).toBe(201);
    expect(uploaded.cookie.includes(ANONYMOUS_SESSION_COOKIE_NAME)).toBe(true);
    expect(uploaded.body.file.status).toBe("pending");
    expect(JSON.stringify(uploaded.body).includes("objectKey")).toBe(false);

    const ownerId = (await fileService.findFileById(uploaded.body.file.id))
      ?.ownerId;
    expect(ownerId).toBeDefined();
    expect(
      (await fileService.findFileById(uploaded.body.file.id))?.ownerKind,
    ).toBe("anonymous_session");

    const completed = await completeAnonymousFile(
      app,
      fileService,
      storage,
      uploaded.body.file.id,
      uploaded.cookie,
      ownerId ?? "",
    );
    expect(completed.status).toBe(200);

    const created = await app.request("/api/v1/anonymous/conversions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: uploaded.cookie,
      },
      body: JSON.stringify({
        sourceFileId: uploaded.body.file.id,
        type: "pdf-to-png",
      }),
    });
    const createdBody = await created.json();

    expect(created.status).toBe(201);
    expect(createdBody.conversion.type).toBe("pdf-to-png");
    expect(createdBody.conversion.targetFormat).toBe("png");
    expect(jobs).toHaveLength(1);

    const status = await app.request(
      `/api/v1/anonymous/conversions/${createdBody.conversion.id}`,
      { headers: { cookie: uploaded.cookie } },
    );
    expect(status.status).toBe(200);

    const download = await app.request(
      `/api/v1/anonymous/files/${uploaded.body.file.id}/download`,
      {
        method: "POST",
        headers: { cookie: uploaded.cookie },
      },
    );
    const downloadBody = await download.json();

    expect(download.status).toBe(200);
    expect(downloadBody.download.url.startsWith("https://")).toBe(true);
  });

  test("rejects expired conversions and files from another anonymous session", async () => {
    let current = new Date("2026-08-24T01:00:00.000Z");
    const { app, fileService, conversionService, storage } = createAnonymousApp(
      {
        now: () => current,
      },
    );
    const first = await uploadAnonymousFile(app);
    const ownerId = (await fileService.findFileById(first.body.file.id))
      ?.ownerId;
    await completeAnonymousFile(
      app,
      fileService,
      storage,
      first.body.file.id,
      first.cookie,
      ownerId ?? "",
    );
    const created = await conversionService.createOwnedConversion({
      ownerId: ownerId ?? "",
      ownerKind: "anonymous_session",
      sourceFileId: first.body.file.id,
      targetFormat: "png",
      type: "pdf-to-png",
      expiresAt: new Date("2026-08-24T01:30:00.000Z"),
    });

    const second = await uploadAnonymousFile(app);
    const foreign = await app.request(
      `/api/v1/anonymous/conversions/${created.id}`,
      { headers: { cookie: second.cookie } },
    );
    expect(foreign.status).toBe(404);

    current = new Date("2026-08-24T02:00:00.000Z");
    const expired = await app.request(
      `/api/v1/anonymous/conversions/${created.id}`,
      { headers: { cookie: first.cookie } },
    );
    expect(expired.status).toBe(404);
    expect(await expired.json()).toMatchObject({
      error: { code: APP_ERROR_CODES.NOT_FOUND },
    });
  });

  test("rate limits anonymous tool executions using session and IP fingerprint together", async () => {
    const subjects: RateLimitSubject[] = [];
    const { app, fileService, storage } = createAnonymousApp({
      checkRateLimit: async (subject) => {
        subjects.push(subject);
        return allowed;
      },
      checkAnonymousOperationRateLimit: async () => denied,
    });

    const uploaded = await uploadAnonymousFile(app);
    expect(uploaded.response.status).toBe(201);

    const ownerId = (await fileService.findFileById(uploaded.body.file.id))
      ?.ownerId;
    await completeAnonymousFile(
      app,
      fileService,
      storage,
      uploaded.body.file.id,
      uploaded.cookie,
      ownerId ?? "",
    );

    const limited = await app.request("/api/v1/anonymous/conversions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: uploaded.cookie,
      },
      body: JSON.stringify({
        sourceFileId: uploaded.body.file.id,
        type: "pdf-to-png",
      }),
    });

    expect(limited.status).toBe(429);
    expect(subjects[0]?.kind).toBe("anonymous");
    if (subjects[0]?.kind === "anonymous") {
      expect(subjects[0].sessionId).not.toBe("unidentified");
      expect(JSON.stringify(subjects[0]).includes("203.0.113")).toBe(false);
    }
  });

  test("keeps authenticated file and conversion APIs protected", async () => {
    const { app, fileService, storage } = createAnonymousApp({
      identity: {
        kind: "session",
        userId: "user_1",
        sessionId: "session_1",
      },
    });

    const forbidden = await app.request("/api/v1/anonymous/files/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(uploadBody),
    });
    expect(forbidden.status).toBe(403);

    const uploaded = await app.request("/api/v1/files/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(uploadBody),
    });
    const uploadedBody = await uploaded.json();
    expect(uploaded.status).toBe(201);

    const file = await fileService.getOwnedFile(uploadedBody.file.id, "user_1");
    expect(file.ownerKind).toBe("user");
    await storage.uploadObject({
      key: file.objectKey,
      body: new Uint8Array(file.sizeBytes),
      contentType: file.mimeType,
    });
    await app.request(`/api/v1/files/${file.id}/complete`, { method: "POST" });

    const created = await app.request("/api/v1/conversions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceFileId: file.id,
        targetFormat: "png",
        type: "pdf-to-png",
      }),
    });
    expect(created.status).toBe(201);
  });

  test("rejects oversized anonymous uploads as FILE_TOO_LARGE", async () => {
    const { app } = createAnonymousApp();
    const response = await app.request("/api/v1/anonymous/files/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...uploadBody,
        size: 26 * 1024 * 1024,
      }),
    });

    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({
      error: { code: APP_ERROR_CODES.FILE_TOO_LARGE },
    });
  });
});
