import { APP_ERROR_CODES, isAppError } from "@sohappypdf/core";
import { UnrecoverableError, Worker } from "bullmq";
import type { ConversionWorker } from "./conversion-worker.js";
import {
  type FileCleanupJobData,
  parseFileCleanupJobData,
} from "./file-cleanup-job.js";
import { getQueueConnection } from "./queue-connection.js";
import { FILE_CLEANUP_QUEUE_NAME } from "./queue-settings.js";

export type FileCleanupWorkerJob = {
  id: string;
  attemptsMade: number;
};

export type FileCleanupJobProcessor = (
  job: FileCleanupWorkerJob,
) => Promise<void>;

export type CreateFileCleanupWorkerOptions = {
  processJob: FileCleanupJobProcessor;
  hooks?: {
    onReady?(): void;
    onCompleted?(job: { id: string }): void;
    onFailed?(job: { id: string; attemptsMade: number }): void;
    onError?(): void;
  };
};

function isPermanentCleanupError(error: unknown): boolean {
  return (
    isAppError(error) &&
    (error.code === APP_ERROR_CODES.VALIDATION_ERROR ||
      error.code === APP_ERROR_CODES.NOT_FOUND ||
      error.code === APP_ERROR_CODES.CONFLICT)
  );
}

export function createFileCleanupWorker(
  options: CreateFileCleanupWorkerOptions,
): ConversionWorker {
  const worker = new Worker<FileCleanupJobData>(
    FILE_CLEANUP_QUEUE_NAME,
    async (job) => {
      parseFileCleanupJobData(job.data);

      try {
        await options.processJob({
          id: job.id ?? FILE_CLEANUP_QUEUE_NAME,
          attemptsMade: job.attemptsMade,
        });
      } catch (error) {
        if (isPermanentCleanupError(error)) {
          throw new UnrecoverableError(
            error instanceof Error ? error.message : "File cleanup failed",
          );
        }

        throw error;
      }
    },
    {
      connection: getQueueConnection("worker"),
      concurrency: 1,
      lockDuration: 60_000,
    },
  );

  worker.on("ready", () => {
    options.hooks?.onReady?.();
  });

  worker.on("completed", (job) => {
    options.hooks?.onCompleted?.({
      id: job.id ?? FILE_CLEANUP_QUEUE_NAME,
    });
  });

  worker.on("failed", (job) => {
    if (job === undefined) {
      return;
    }

    options.hooks?.onFailed?.({
      id: job.id ?? FILE_CLEANUP_QUEUE_NAME,
      attemptsMade: job.attemptsMade,
    });
  });

  worker.on("error", () => {
    options.hooks?.onError?.();
  });

  return {
    async close(force = false) {
      await worker.close(force);
    },
  };
}
