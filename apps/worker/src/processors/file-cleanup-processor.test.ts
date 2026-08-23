import { describe, expect, test } from "bun:test";
import { isAppError } from "@repo/core";
import type { FileService } from "@repo/files";
import { createLogger } from "@repo/logger";
import { createFileCleanupProcessor } from "./file-cleanup-processor.js";

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
      } as FileService,
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
      } as FileService,
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
});
