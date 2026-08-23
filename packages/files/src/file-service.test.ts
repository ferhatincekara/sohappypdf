import { describe, expect, test } from "bun:test";
import { isAppError } from "@repo/core";
import type { Storage } from "@repo/storage";
import { createFileOriginalKey } from "@repo/storage";
import type { FileRepository } from "./file-repository.js";
import { createFileService } from "./file-service.js";
import type { FileRecord } from "./file-types.js";

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
}): Storage & { keys: Set<string> } {
  const keys = new Set(options?.existingKeys);

  return {
    keys,
    async uploadObject(input) {
      keys.add(input.key);
      return { key: input.key };
    },
    async createPresignedUploadUrl(input) {
      keys.add(input.key);
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

      keys.delete(key);
    },
    async objectExists(key) {
      return keys.has(key);
    },
  };
}

const createInput = {
  originalFilename: "report.pdf",
  mimeType: "application/pdf",
  sizeBytes: 2048,
};

describe("file service", () => {
  test("creates a pending file with a generated object key and upload URL", async () => {
    const storage = createMemoryStorage();
    const service = createFileService({
      repository: createMemoryRepository(),
      storage,
      now: () => new Date("2026-08-23T18:00:00.000Z"),
      fileTtlMs: 2 * 60 * 60 * 1000,
    });

    const result = await service.createFile(createInput);

    expect(result.file.status).toBe("pending");
    expect(result.file.originalFilename).toBe("report.pdf");
    expect(result.file.objectKey).toBe(createFileOriginalKey(result.file.id));
    expect(result.file.expiresAt.toISOString()).toBe(
      "2026-08-23T20:00:00.000Z",
    );
    expect(result.upload.key).toBe(result.file.objectKey);
    expect(result.upload.url.startsWith("https://")).toBe(true);
    expect(result.file.objectKey.includes("report.pdf")).toBe(false);
  });

  test("rejects path-like original filenames", async () => {
    const service = createFileService({
      repository: createMemoryRepository(),
      storage: createMemoryStorage(),
    });

    try {
      await service.createFile({
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

  test("marks a file uploaded only after the object exists", async () => {
    const storage = createMemoryStorage();
    const service = createFileService({
      repository: createMemoryRepository(),
      storage,
    });
    const { file } = await service.createFile(createInput);
    const uploaded = await service.markFileUploaded(file.id);

    expect(uploaded.status).toBe("uploaded");
    expect(await service.markFileUploaded(file.id)).toEqual(uploaded);
  });

  test("marks a file failed when the object is missing", async () => {
    const storage = createMemoryStorage();
    const service = createFileService({
      repository: createMemoryRepository(),
      storage,
    });
    const { file } = await service.createFile(createInput);
    storage.keys.delete(file.objectKey);

    try {
      await service.markFileUploaded(file.id);
      throw new Error("expected upload confirmation to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("CONFLICT");
      }
    }

    const failed = await service.findFileById(file.id);
    expect(failed?.status).toBe("failed");
  });

  test("deletes the storage object and marks the file deleted", async () => {
    const storage = createMemoryStorage();
    const service = createFileService({
      repository: createMemoryRepository(),
      storage,
      now: () => new Date("2026-08-23T18:05:00.000Z"),
    });
    const { file } = await service.createFile(createInput);
    const deleted = await service.deleteFile(file.id);

    expect(deleted.status).toBe("deleted");
    expect(deleted.deletedAt?.toISOString()).toBe("2026-08-23T18:05:00.000Z");
    expect(storage.keys.has(file.objectKey)).toBe(false);

    const again = await service.deleteFile(file.id);
    expect(again.status).toBe("deleted");
  });

  test("does not mark a file deleted when storage deletion fails", async () => {
    const storage = createMemoryStorage({ failDelete: true });
    const service = createFileService({
      repository: createMemoryRepository(),
      storage,
    });
    const { file } = await service.createFile(createInput);

    try {
      await service.deleteFile(file.id);
      throw new Error("expected delete to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }

    const stored = await service.findFileById(file.id);
    expect(stored?.status).toBe("pending");
  });

  test("lists expired non-deleted files for cleanup", async () => {
    const now = new Date("2026-08-23T21:00:00.000Z");
    const expired: FileRecord = {
      id: "550e8400-e29b-41d4-a716-446655440000",
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
