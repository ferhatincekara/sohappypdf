import { describe, expect, test } from "bun:test";
import type { ConversionService } from "@sohappypdf/conversions";
import { isAppError } from "@sohappypdf/core";
import type { FileService } from "@sohappypdf/files";
import { createLogger } from "@sohappypdf/logger";
import { createFileCleanupProcessor } from "./file-cleanup-processor.js";

function createConversionsStub(
  overrides: Partial<ConversionService> = {},
): ConversionService {
  return {
    async cleanupExpiredConversions() {
      return { scanned: 0, deleted: 0 };
    },
    async deleteReferencingFile() {
      return 0;
    },
    ...overrides,
  } as ConversionService;
}

describe("file cleanup processor", () => {
  test("drains expired files in batches", async () => {
    const batches = [2, 0];
    const processor = createFileCleanupProcessor({
      files: {
        async cleanupExpiredFiles() {
          const scanned = batches.shift() ?? 0;
          return {
            scanned,
            deleted: scanned,
            failed: 0,
            failureFileIds: [],
          };
        },
        async listPurgedFiles() {
          return [];
        },
      } as FileService,
      conversions: createConversionsStub(),
      logger: createLogger({ level: "error" }),
      batchSize: 100,
    });

    await processor({ id: "cleanup-1", attemptsMade: 0 });
    expect(batches).toEqual([]);
  });

  test("retries when a batch reports failures", async () => {
    const processor = createFileCleanupProcessor({
      files: {
        async cleanupExpiredFiles() {
          return {
            scanned: 2,
            deleted: 1,
            failed: 1,
            failureFileIds: ["550e8400-e29b-41d4-a716-446655440000"],
          };
        },
        async listPurgedFiles() {
          return [];
        },
      } as FileService,
      conversions: createConversionsStub(),
      logger: createLogger({ level: "error" }),
      batchSize: 100,
    });

    try {
      await processor({ id: "cleanup-1", attemptsMade: 0 });
      throw new Error("expected cleanup to retry");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("INTERNAL_ERROR");
      }
    }
  });

  test("removes purged files after detaching conversions", async () => {
    const hardDeleted: string[] = [];
    const detached: string[] = [];
    const processor = createFileCleanupProcessor({
      files: {
        async cleanupExpiredFiles() {
          return {
            scanned: 1,
            deleted: 1,
            failed: 0,
            failureFileIds: [],
          };
        },
        async listPurgedFiles() {
          if (hardDeleted.length > 0) {
            return [];
          }

          return [
            {
              id: "550e8400-e29b-41d4-a716-446655440000",
              ownerId: "user_1",
              ownerKind: "user",
              originalFilename: "a.pdf",
              mimeType: "application/pdf",
              sizeBytes: 10,
              objectKey: "files/a/original",
              status: "deleted",
              createdAt: new Date(),
              updatedAt: new Date(),
              expiresAt: new Date(),
              deletedAt: new Date(),
              purgedAt: new Date(),
            },
          ];
        },
        async hardDeleteFile(id) {
          hardDeleted.push(id);
        },
      } as FileService,
      conversions: createConversionsStub({
        async deleteReferencingFile(fileId) {
          detached.push(fileId);
          return 1;
        },
      }),
      logger: createLogger({ level: "error" }),
      batchSize: 100,
    });

    await processor({ id: "cleanup-1", attemptsMade: 0 });
    expect(detached).toEqual(["550e8400-e29b-41d4-a716-446655440000"]);
    expect(hardDeleted).toEqual(["550e8400-e29b-41d4-a716-446655440000"]);
  });
});
