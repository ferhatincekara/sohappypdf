import { describe, expect, test } from "bun:test";
import { isAppError } from "@repo/core";
import type { Storage } from "@repo/storage";
import { createFileOriginalKey } from "@repo/storage";
import type { FileRepository } from "./file-repository.js";
import { createFileService } from "./file-service.js";
import type { FileRecord } from "./file-types.js";

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
    async listEligibleForCleanup(input) {
      return [...records.values()]
        .filter(
          (file) =>
            file.status !== "deleted" &&
            file.expiresAt.getTime() <= input.now.getTime(),
        )
        .slice(0, input.limit)
        .map((file) => ({ ...file }));
    },
  };
}

function createMemoryStorage(options?: {
  failDelete?: boolean;
  existingKeys?: Iterable<string>;
}): Storage & { objects: Map<string, StoredObject> } {
  const objects = new Map<string, StoredObject>(
    [...(options?.existingKeys ?? [])].map((key) => [
      key,
      { contentLength: 1 },
    ]),
  );

  return {
    objects,
    async uploadObject(input) {
      objects.set(input.key, {
        contentLength: input.body.byteLength,
        contentType: input.contentType,
      });
      return { key: input.key };
    },
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
        expiresInSeconds: input.expiresInSeconds ?? 900,
        url: `https://example.invalid/${input.key}`,
      };
    },
    async deleteObject(key) {
      if (options?.failDelete === true) {
        throw new Error("storage delete failed");
      }

      objects.delete(key);
    },
    async objectExists(key) {
      return objects.has(key);
    },
    async getObject(key) {
      const object = objects.get(key);

      if (object === undefined) {
        throw new Error("object not found");
      }

      return { key, body: new Uint8Array(object.contentLength) };
    },
    async getObjectMetadata(key) {
      const object = objects.get(key);

      if (object === undefined) {
        return undefined;
      }

      return {
        key,
        contentLength: object.contentLength,
        contentType: object.contentType,
      };
    },
  };
}

const createInput = {
  ownerId: "user_1",
  originalFilename: "report.pdf",
  mimeType: "application/pdf",
  sizeBytes: 2048,
};

async function storeUploadedObject(
  storage: Storage & { objects: Map<string, StoredObject> },
  file: FileRecord,
) {
  await storage.uploadObject({
    key: file.objectKey,
    body: new Uint8Array(file.sizeBytes),
    contentType: file.mimeType,
  });
}

describe("file service", () => {
  test("creates a pending file with a generated object key and upload URL", async () => {
    const storage = createMemoryStorage();
    const service = createFileService({
      repository: createMemoryRepository(),
      storage,
      now: () => new Date("2026-08-23T18:00:00.000Z"),
      fileTtlMs: 2 * 60 * 60 * 1000,
    });

    const result = await service.createUploadIntent(createInput);

    expect(result.file.status).toBe("pending");
    expect(result.file.ownerId).toBe("user_1");
    expect(result.file.originalFilename).toBe("report.pdf");
    expect(result.file.objectKey).toBe(createFileOriginalKey(result.file.id));
    expect(result.file.expiresAt.toISOString()).toBe(
      "2026-08-23T20:00:00.000Z",
    );
    expect(result.upload.key).toBe(result.file.objectKey);
    expect(result.upload.url.startsWith("https://")).toBe(true);
    expect(result.file.objectKey.includes("report.pdf")).toBe(false);
    expect(storage.objects.has(result.file.objectKey)).toBe(false);
  });

  test("registers an already stored object without creating an upload URL", async () => {
    const storage = createMemoryStorage({
      existingKeys: ["files/550e8400-e29b-41d4-a716-446655440099/output/job"],
    });
    const service = createFileService({
      repository: createMemoryRepository(),
      storage,
    });

    const file = await service.registerStoredFile({
      id: "550e8400-e29b-41d4-a716-446655440099",
      ownerId: "user_1",
      originalFilename: "output.pdf",
      mimeType: "application/pdf",
      sizeBytes: 128,
      objectKey: "files/550e8400-e29b-41d4-a716-446655440099/output/job",
    });

    expect(file.status).toBe("uploaded");
    expect(file.ownerId).toBe("user_1");
    expect(file.objectKey).toBe(
      "files/550e8400-e29b-41d4-a716-446655440099/output/job",
    );
    expect(
      await service.registerStoredFile({
        id: file.id,
        ownerId: "user_1",
        originalFilename: "output.pdf",
        mimeType: "application/pdf",
        sizeBytes: 128,
        objectKey: file.objectKey,
      }),
    ).toEqual(file);
  });

  test("rejects path-like original filenames", async () => {
    const service = createFileService({
      repository: createMemoryRepository(),
      storage: createMemoryStorage(),
    });

    try {
      await service.createUploadIntent({
        ...createInput,
        originalFilename: "../../secret.pdf",
      });
      throw new Error("expected validation to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("VALIDATION_ERROR");
      }
    }
  });

  test("marks a file uploaded only after the object exists and matches", async () => {
    const storage = createMemoryStorage();
    const service = createFileService({
      repository: createMemoryRepository(),
      storage,
    });
    const { file } = await service.createUploadIntent(createInput);
    await storeUploadedObject(storage, file);
    const uploaded = await service.completeUpload(file.id, "user_1");

    expect(uploaded.status).toBe("uploaded");
    expect(await service.completeUpload(file.id, "user_1")).toEqual(uploaded);
  });

  test("does not mark a file ready when the object is missing or mismatched", async () => {
    const storage = createMemoryStorage();
    const service = createFileService({
      repository: createMemoryRepository(),
      storage,
    });
    const { file } = await service.createUploadIntent(createInput);

    try {
      await service.completeUpload(file.id, "user_1");
      throw new Error("expected upload confirmation to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("CONFLICT");
      }
    }

    expect((await service.findFileById(file.id))?.status).toBe("failed");
  });

  test("hides another user's file", async () => {
    const service = createFileService({
      repository: createMemoryRepository(),
      storage: createMemoryStorage(),
    });
    const { file } = await service.createUploadIntent(createInput);

    try {
      await service.getOwnedFile(file.id, "user_2");
      throw new Error("expected ownership check to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("NOT_FOUND");
      }
    }
  });

  test("treats expired files as unavailable", async () => {
    let currentTime = new Date("2026-08-23T18:00:00.000Z");
    const service = createFileService({
      repository: createMemoryRepository(),
      storage: createMemoryStorage(),
      now: () => currentTime,
      fileTtlMs: 60_000,
    });
    const { file } = await service.createUploadIntent(createInput);
    currentTime = new Date("2026-08-23T18:02:00.000Z");

    try {
      await service.getOwnedFile(file.id, "user_1");
      throw new Error("expected expired file to be unavailable");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("NOT_FOUND");
      }
    }
  });

  test("lists only the owner's unexpired files with a cursor", async () => {
    const now = new Date("2026-08-23T18:00:00.000Z");
    const service = createFileService({
      repository: createMemoryRepository(),
      storage: createMemoryStorage(),
      now: () => now,
    });
    const first = await service.createUploadIntent({
      ...createInput,
      originalFilename: "one.pdf",
    });
    const second = await service.createUploadIntent({
      ...createInput,
      originalFilename: "two.pdf",
    });
    await service.createUploadIntent({
      ...createInput,
      ownerId: "user_2",
      originalFilename: "other.pdf",
    });

    const page = await service.listOwnedFiles({
      ownerId: "user_1",
      limit: 1,
    });
    const next = await service.listOwnedFiles({
      ownerId: "user_1",
      limit: 1,
      cursor: page.nextCursor ?? undefined,
    });
    const listedIds = [...page.files, ...next.files].map((file) => file.id);

    expect(page.files).toHaveLength(1);
    expect(page.nextCursor).toBeString();
    expect(next.files).toHaveLength(1);
    expect(listedIds.sort()).toEqual([first.file.id, second.file.id].sort());
  });

  test("marks the file unavailable before deleting the object", async () => {
    const storage = createMemoryStorage();
    const service = createFileService({
      repository: createMemoryRepository(),
      storage,
      now: () => new Date("2026-08-23T18:05:00.000Z"),
    });
    const { file } = await service.createUploadIntent(createInput);
    await storeUploadedObject(storage, file);
    const deleted = await service.deleteOwnedFile(file.id, "user_1");

    expect(deleted.status).toBe("deleted");
    expect(deleted.deletedAt?.toISOString()).toBe("2026-08-23T18:05:00.000Z");
    expect(storage.objects.has(file.objectKey)).toBe(false);

    const again = await service.deleteOwnedFile(file.id, "user_1");
    expect(again.status).toBe("deleted");
  });

  test("keeps the file unavailable if storage deletion fails after the database update", async () => {
    const storage = createMemoryStorage({ failDelete: true });
    const service = createFileService({
      repository: createMemoryRepository(),
      storage,
    });
    const { file } = await service.createUploadIntent(createInput);

    try {
      await service.deleteOwnedFile(file.id, "user_1");
      throw new Error("expected delete to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }

    const stored = await service.findFileById(file.id);
    expect(stored?.status).toBe("deleted");
  });

  test("lists expired non-deleted files for cleanup", async () => {
    const now = new Date("2026-08-23T21:00:00.000Z");
    const expired: FileRecord = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      ownerId: "user_1",
      originalFilename: "old.pdf",
      mimeType: "application/pdf",
      sizeBytes: 10,
      objectKey: "files/550e8400-e29b-41d4-a716-446655440000/original",
      status: "uploaded",
      createdAt: new Date("2026-08-23T18:00:00.000Z"),
      updatedAt: new Date("2026-08-23T18:00:00.000Z"),
      expiresAt: new Date("2026-08-23T20:00:00.000Z"),
      deletedAt: null,
    };
    const service = createFileService({
      repository: createMemoryRepository([expired]),
      storage: createMemoryStorage(),
      now: () => now,
    });

    const eligible = await service.listFilesEligibleForCleanup();
    expect(eligible.map((file) => file.id)).toEqual([expired.id]);
  });
});
