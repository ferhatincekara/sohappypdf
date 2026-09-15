import type { ConversionService } from "@sohappypdf/conversions";
import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import type { FileCleanupSummary, FileService } from "@sohappypdf/files";
import type { Logger } from "@sohappypdf/logger";
import {
  FILE_CLEANUP_MAX_BATCHES_PER_JOB,
  type FileCleanupWorkerJob,
} from "@sohappypdf/queue";

export type AnonymousSessionCleanup = {
  deleteExpired(input: {
    now: Date;
    limit: number;
  }): Promise<{ scanned: number; deleted: number }>;
};

export type FileCleanupProcessorDependencies = {
  files: FileService;
  conversions: ConversionService;
  anonymousSessions?: AnonymousSessionCleanup;
  logger: Logger;
  batchSize: number;
  now?: () => Date;
};

export function createFileCleanupProcessor(
  dependencies: FileCleanupProcessorDependencies,
): (job: FileCleanupWorkerJob) => Promise<void> {
  return async (job) => {
    const startedAt = Date.now();
    const now = dependencies.now ?? (() => new Date());
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
    let conversionsDeleted = 0;
    let anonymousSessionsDeleted = 0;

    for (let batch = 0; batch < FILE_CLEANUP_MAX_BATCHES_PER_JOB; batch += 1) {
      const expiredConversions =
        await dependencies.conversions.cleanupExpiredConversions(
          dependencies.batchSize,
        );
      conversionsDeleted += expiredConversions.deleted;

      const result = await dependencies.files.cleanupExpiredFiles(
        dependencies.batchSize,
      );
      totals.scanned += result.scanned;
      totals.deleted += result.deleted;
      totals.failed += result.failed;
      totals.failureFileIds.push(...result.failureFileIds);

      if (dependencies.anonymousSessions !== undefined) {
        const sessions = await dependencies.anonymousSessions.deleteExpired({
          now: now(),
          limit: dependencies.batchSize,
        });
        anonymousSessionsDeleted += sessions.deleted;
      }

      if (result.scanned === 0 && expiredConversions.scanned === 0) {
        break;
      }
    }

    logger.info("file cleanup completed", {
      scanned: totals.scanned,
      deleted: totals.deleted,
      failed: totals.failed,
      conversionsDeleted,
      anonymousSessionsDeleted,
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
