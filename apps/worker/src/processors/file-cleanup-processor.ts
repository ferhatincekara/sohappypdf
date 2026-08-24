import type { ConversionService } from "@repo/conversions";
import { APP_ERROR_CODES, AppError } from "@repo/core";
import type { FileCleanupSummary, FileService } from "@repo/files";
import type { Logger } from "@repo/logger";
import {
  FILE_CLEANUP_MAX_BATCHES_PER_JOB,
  type FileCleanupWorkerJob,
} from "@repo/queue";

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
    let anonymousFilesRemoved = 0;

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

      const purgedAnonymous = await dependencies.files.listPurgedAnonymousFiles(
        dependencies.batchSize,
      );

      for (const file of purgedAnonymous) {
        try {
          await dependencies.conversions.deleteReferencingFile(file.id);
          await dependencies.files.hardDeleteFile(file.id);
          anonymousFilesRemoved += 1;
        } catch {
          totals.failed += 1;
          totals.failureFileIds.push(file.id);
        }
      }

      if (dependencies.anonymousSessions !== undefined) {
        const sessions = await dependencies.anonymousSessions.deleteExpired({
          now: now(),
          limit: dependencies.batchSize,
        });
        anonymousSessionsDeleted += sessions.deleted;
      }

      if (
        result.scanned === 0 &&
        expiredConversions.scanned === 0 &&
        purgedAnonymous.length === 0
      ) {
        break;
      }
    }

    logger.info("file cleanup completed", {
      scanned: totals.scanned,
      deleted: totals.deleted,
      failed: totals.failed,
      conversionsDeleted,
      anonymousFilesRemoved,
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
