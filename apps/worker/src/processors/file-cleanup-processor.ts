import { APP_ERROR_CODES, AppError } from "@repo/core";
import type { FileCleanupSummary, FileService } from "@repo/files";
import type { Logger } from "@repo/logger";
import {
  FILE_CLEANUP_MAX_BATCHES_PER_JOB,
  type FileCleanupWorkerJob,
} from "@repo/queue";

export type FileCleanupProcessorDependencies = {
  files: FileService;
  logger: Logger;
  batchSize: number;
};

export function createFileCleanupProcessor(
  dependencies: FileCleanupProcessorDependencies,
): (job: FileCleanupWorkerJob) => Promise<void> {
  return async (job) => {
    const startedAt = Date.now();
    const logger = dependencies.logger.child({
      jobId: job.id,
      cleanupJob: "expired",
    });
    logger.info("file cleanup started", {
      batchSize: dependencies.batchSize,
    });

    const totals: FileCleanupSummary = {
      scanned: 0,
      deleted: 0,
      failed: 0,
      failureFileIds: [],
    };

    for (let batch = 0; batch < FILE_CLEANUP_MAX_BATCHES_PER_JOB; batch += 1) {
      const result = await dependencies.files.cleanupExpiredFiles(
        dependencies.batchSize,
      );
      totals.scanned += result.scanned;
      totals.deleted += result.deleted;
      totals.failed += result.failed;
      totals.failureFileIds.push(...result.failureFileIds);

      if (result.scanned === 0) {
        break;
      }
    }

    logger.info("file cleanup completed", {
      scanned: totals.scanned,
      deleted: totals.deleted,
      failed: totals.failed,
      durationMs: Date.now() - startedAt,
    });

    if (totals.failed > 0) {
      throw new AppError({
        code: APP_ERROR_CODES.INTERNAL_ERROR,
        message: "File cleanup encountered retryable failures",
      });
    }
  };
}
