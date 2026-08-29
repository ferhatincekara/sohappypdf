import { describe, expect, test } from "bun:test";
import {
  createTestBillingService,
  DEFAULT_PLAN_LIMITS,
} from "@sohappypdf/billing";
import { APP_ERROR_CODES } from "@sohappypdf/core";
import {
  createFileService,
  type FileRecord,
  type FileRepository,
  type FileService,
  sumActiveStorageBytesForOwner,
} from "@sohappypdf/files";
import type { Logger } from "@sohappypdf/logger";
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

type StoredObject = {
  contentLength: number;
  contentType?: string;
};

function createMemoryRepository(seed: FileRecord[] = []): FileRepository {
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
    async listByOwner(input) {
      return [...records.values()]
        .filter((file) => {
          if (
            file.ownerId !== input.ownerId ||
            file.status === "deleted" ||
            file.deletedAt !== null ||
            file.purgedAt !== null ||
            file.expiresAt.getTime() <= input.now.getTime()
          ) {
            return false;
          }

          if (input.cursor === undefined) {
            return true;
          }

          if (file.createdAt.getTime() < input.cursor.createdAt.getTime()) {
            return true;
          }

          return (
            file.createdAt.getTime() === input.cursor.createdAt.getTime() &&
            file.id < input.cursor.id
          );
        })
        .sort((left, right) => {
          const created = right.createdAt.getTime() - left.createdAt.getTime();
          return created === 0 ? right.id.localeCompare(left.id) : created;
        })
        .slice(0, input.limit)
        .map((file) => ({ ...file }));
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
    async markPurged(input) {
      const file = records.get(input.id);

      if (file === undefined || file.purgedAt !== null) {
        return undefined;
      }

      const updated = {
        ...file,
        status: "deleted" as const,
        deletedAt: file.deletedAt ?? input.now,
        purgedAt: input.now,
        updatedAt: input.now,
      };
      records.set(input.id, updated);
      return { ...updated };
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

function createMemoryStorage(): Storage & {
  objects: Map<string, StoredObject>;
} {
  const objects = new Map<string, StoredObject>();

  return {
    objects,
    async uploadObject(input) {
      objects.set(input.key, {
        contentLength: input.body.byteLength,
        contentType: input.contentType,
      });
      return { key: input.key };
    },
    async uploadObjectFromFile(input) {
      objects.set(input.key, {
        contentLength: 1,
        contentType: input.contentType,
      });
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
        url:
          input.filename === undefined
            ? `https://example.invalid/${input.key}`
            : `https://example.invalid/${input.key}?filename=${encodeURIComponent(input.filename)}`,
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
        : {
            key,
            contentLength: object.contentLength,
            contentType: object.contentType,
          };
    },
  };
}

function createTestFileService(now?: () => Date): {
  fileService: FileService;
  storage: ReturnType<typeof createMemoryStorage>;
} {
  const storage = createMemoryStorage();
  return {
    storage,
    fileService: createFileService({
      repository: createMemoryRepository(),
      storage,
      now,
    }),
  };
}

function createFileApp(options: {
  identity: RequestIdentity;
  fileService: FileService;
  billingService?: ReturnType<typeof createTestBillingService>;
}) {
  return createApp({
    config: { corsOrigins: [] },
    logger: silentLogger,
    resolveIdentity: async () => options.identity,
    fileService: options.fileService,
    billingService: options.billingService ?? createTestBillingService(),
  });
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

const uploadBody = {
  filename: "report.pdf",
  contentType: "application/pdf",
  size: 2048,
};

describe("file API", () => {
  test("requires authentication for file routes", async () => {
    const { fileService } = createTestFileService();
    const app = createFileApp({
      identity: { kind: "anonymous" },
      fileService,
    });

    const response = await app.request("/v1/files/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(uploadBody),
    });

    expect(response.status).toBe(401);
  });

  test("rejects unsupported content types and oversized files", async () => {
    const { fileService } = createTestFileService();
    const app = createFileApp({ identity: sessionIdentity, fileService });

    const unsupported = await app.request("/v1/files/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...uploadBody,
        contentType: "application/zip",
      }),
    });
    const oversized = await app.request("/v1/files/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...uploadBody,
        size: 200 * 1024 * 1024,
      }),
    });

    expect(unsupported.status).toBe(400);
    expect(await unsupported.json()).toMatchObject({
      error: { code: APP_ERROR_CODES.VALIDATION_ERROR },
    });
    expect(oversized.status).toBe(400);
  });

  test("creates a presigned upload intent for a session user", async () => {
    const { fileService } = createTestFileService();
    const app = createFileApp({ identity: sessionIdentity, fileService });

    const response = await app.request("/v1/files/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(uploadBody),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.file.status).toBe("pending");
    expect(body.file.filename).toBe("report.pdf");
    expect(body.upload.method).toBe("PUT");
    expect(body.upload.url.startsWith("https://")).toBe(true);
    expect(body.upload.headers["Content-Type"]).toBe("application/pdf");
    expect(JSON.stringify(body).includes("objectKey")).toBe(false);
  });

  test("allows API-key identities to manage their owner's files", async () => {
    const { fileService, storage } = createTestFileService();
    const app = createFileApp({ identity: apiKeyIdentity, fileService });
    const created = await app.request("/v1/files/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(uploadBody),
    });
    const createdBody = await created.json();
    const file = await fileService.getOwnedFile(createdBody.file.id, "user_1");
    await storage.uploadObject({
      key: file.objectKey,
      body: new Uint8Array(file.sizeBytes),
      contentType: file.mimeType,
    });

    const completed = await app.request(
      `/v1/files/${createdBody.file.id}/complete`,
      { method: "POST" },
    );

    expect(completed.status).toBe(200);
    expect(await completed.json()).toMatchObject({
      file: { id: createdBody.file.id, status: "uploaded" },
    });
  });

  test("creates a presigned download URL for an uploaded owned file", async () => {
    const { fileService, storage } = createTestFileService();
    const app = createFileApp({ identity: sessionIdentity, fileService });
    const created = await app.request("/v1/files/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(uploadBody),
    });
    const createdBody = await created.json();
    const file = await fileService.getOwnedFile(createdBody.file.id, "user_1");
    await storage.uploadObject({
      key: file.objectKey,
      body: new Uint8Array(file.sizeBytes),
      contentType: file.mimeType,
    });
    await app.request(`/v1/files/${createdBody.file.id}/complete`, {
      method: "POST",
    });

    const response = await app.request(
      `/v1/files/${createdBody.file.id}/download`,
      { method: "POST" },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.download.url.startsWith("https://")).toBe(true);
    expect(body.download.expiresInSeconds).toBeGreaterThan(0);
    expect(JSON.stringify(body).includes("objectKey")).toBe(false);
  });

  test("creates a zip download for multiple owned files", async () => {
    const { fileService, storage } = createTestFileService();
    const app = createFileApp({ identity: sessionIdentity, fileService });
    const uploaded: string[] = [];

    for (const filename of ["one.pdf", "two.pdf"]) {
      const created = await app.request("/v1/files/upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...uploadBody, filename }),
      });
      const createdBody = await created.json();
      const file = await fileService.getOwnedFile(
        createdBody.file.id,
        "user_1",
      );
      await storage.uploadObject({
        key: file.objectKey,
        body: new Uint8Array(file.sizeBytes),
        contentType: file.mimeType,
      });
      await app.request(`/v1/files/${createdBody.file.id}/complete`, {
        method: "POST",
      });
      uploaded.push(createdBody.file.id);
    }

    const response = await app.request("/v1/files/archive", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        files: [
          { id: uploaded[0], name: "one.docx" },
          { id: uploaded[1], name: "two.docx" },
        ],
        archiveName: "pdf-to-word.zip",
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.download.url).toContain("filename=pdf-to-word.zip");
  });

  test("hides another user's download URL", async () => {
    const { fileService, storage } = createTestFileService();
    const ownerApp = createFileApp({ identity: sessionIdentity, fileService });
    const created = await ownerApp.request("/v1/files/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(uploadBody),
    });
    const createdBody = await created.json();
    const file = await fileService.getOwnedFile(createdBody.file.id, "user_1");
    await storage.uploadObject({
      key: file.objectKey,
      body: new Uint8Array(file.sizeBytes),
      contentType: file.mimeType,
    });
    await ownerApp.request(`/v1/files/${createdBody.file.id}/complete`, {
      method: "POST",
    });
    const otherApp = createFileApp({
      identity: {
        kind: "session",
        userId: "user_2",
        sessionId: "session_2",
      },
      fileService,
    });

    const response = await otherApp.request(
      `/v1/files/${createdBody.file.id}/download`,
      { method: "POST" },
    );

    expect(response.status).toBe(404);
  });

  test("does not complete an upload when the object is missing", async () => {
    const { fileService } = createTestFileService();
    const app = createFileApp({ identity: sessionIdentity, fileService });
    const created = await app.request("/v1/files/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(uploadBody),
    });
    const createdBody = await created.json();

    const response = await app.request(
      `/v1/files/${createdBody.file.id}/complete`,
      { method: "POST" },
    );

    expect(response.status).toBe(409);
  });

  test("hides another user's file on get and delete", async () => {
    const { fileService } = createTestFileService();
    const ownerApp = createFileApp({ identity: sessionIdentity, fileService });
    const created = await ownerApp.request("/v1/files/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(uploadBody),
    });
    const createdBody = await created.json();
    const otherApp = createFileApp({
      identity: {
        kind: "session",
        userId: "user_2",
        sessionId: "session_2",
      },
      fileService,
    });

    const getResponse = await otherApp.request(
      `/v1/files/${createdBody.file.id}`,
    );
    const deleteResponse = await otherApp.request(
      `/v1/files/${createdBody.file.id}`,
      { method: "DELETE" },
    );

    expect(getResponse.status).toBe(404);
    expect(deleteResponse.status).toBe(404);
  });

  test("treats expired files as unavailable", async () => {
    let currentTime = new Date("2026-08-23T18:00:00.000Z");
    const { fileService } = createTestFileService(() => currentTime);
    const app = createFileApp({ identity: sessionIdentity, fileService });
    const created = await app.request("/v1/files/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(uploadBody),
    });
    const createdBody = await created.json();
    currentTime = new Date("2026-08-23T21:00:00.000Z");

    const response = await app.request(`/v1/files/${createdBody.file.id}`);
    const complete = await app.request(
      `/v1/files/${createdBody.file.id}/complete`,
      { method: "POST" },
    );
    const download = await app.request(
      `/v1/files/${createdBody.file.id}/download`,
      { method: "POST" },
    );
    const downloadBody = await download.json();

    expect(response.status).toBe(410);
    expect(complete.status).toBe(410);
    expect(download.status).toBe(410);
    expect(downloadBody).toMatchObject({
      error: {
        code: APP_ERROR_CODES.FILE_EXPIRED,
        message: "This file has expired. Please process it again.",
      },
    });
    expect(JSON.stringify(downloadBody).includes("objectKey")).toBe(false);
  });

  test("lists only the authenticated user's files with bounded pagination", async () => {
    const { fileService } = createTestFileService();
    const app = createFileApp({ identity: sessionIdentity, fileService });

    await app.request("/v1/files/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...uploadBody, filename: "one.pdf" }),
    });
    await app.request("/v1/files/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...uploadBody, filename: "two.pdf" }),
    });

    const tooLarge = await app.request("/v1/files?limit=1000000");
    const page = await app.request("/v1/files?limit=1");
    const pageBody = await page.json();
    const next = await app.request(
      `/v1/files?limit=1&cursor=${pageBody.nextCursor}`,
    );

    expect(tooLarge.status).toBe(400);
    expect(page.status).toBe(200);
    expect(pageBody.files).toHaveLength(1);
    expect(pageBody.nextCursor).toBeString();
    expect((await next.json()).files).toHaveLength(1);
  });

  test("deletes an owned file", async () => {
    const { fileService } = createTestFileService();
    const app = createFileApp({ identity: sessionIdentity, fileService });
    const created = await app.request("/v1/files/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(uploadBody),
    });
    const createdBody = await created.json();

    const response = await app.request(`/v1/files/${createdBody.file.id}`, {
      method: "DELETE",
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      file: { id: createdBody.file.id, status: "deleted" },
    });
    expect((await app.request(`/v1/files/${createdBody.file.id}`)).status).toBe(
      404,
    );
  });

  test("rejects uploads that exceed the current plan file size", async () => {
    const { fileService } = createTestFileService();
    const app = createFileApp({ identity: sessionIdentity, fileService });

    const response = await app.request("/v1/files/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...uploadBody,
        size: 21 * 1024 * 1024,
      }),
    });

    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({
      error: { code: APP_ERROR_CODES.FILE_TOO_LARGE },
    });
  });

  test("rejects uploads that exceed remaining storage", async () => {
    const { fileService } = createTestFileService();
    const app = createFileApp({
      identity: sessionIdentity,
      fileService,
      billingService: createTestBillingService({
        planCatalog: {
          ...DEFAULT_PLAN_LIMITS,
          free: {
            ...DEFAULT_PLAN_LIMITS.free,
            storageBytes: 1000,
          },
        },
      }),
    });

    const first = await app.request("/v1/files/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...uploadBody,
        size: 800,
      }),
    });
    const second = await app.request("/v1/files/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...uploadBody,
        filename: "extra.pdf",
        size: 400,
      }),
    });

    expect(first.status).toBe(201);
    expect(second.status).toBe(403);
    expect(await second.json()).toMatchObject({
      error: { code: APP_ERROR_CODES.STORAGE_LIMIT_REACHED },
    });
  });
});
