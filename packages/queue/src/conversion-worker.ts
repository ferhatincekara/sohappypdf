import { APP_ERROR_CODES, isAppError } from "@repo/core";
import { UnrecoverableError, Worker } from "bullmq";
import {
  type ConversionJobData,
  parseConversionJobData,
} from "./conversion-job.js";
import { getQueueConnection } from "./queue-connection.js";
import { CONVERSION_QUEUE_NAME } from "./queue-settings.js";

export type ConversionWorkerJob = {
  id: string;
  data: ConversionJobData;
  attemptsMade: number;
};

export type ConversionJobProcessor = (
  job: ConversionWorkerJob,
) => Promise<void>;

export type ConversionWorker = {
  close(force?: boolean): Promise<void>;
};

export type ConversionWorkerHooks = {
  onReady?(): void;
  onCompleted?(job: { id: string; conversionId: string }): void;
  onFailed?(job: {
    id: string;
    conversionId: string;
    attemptsMade: number;
    permanent: boolean;
  }): void;
  onError?(): void;
};

export type CreateConversionWorkerOptions = {
  processJob: ConversionJobProcessor;
  concurrency: number;
  lockDurationMs: number;
  hooks?: ConversionWorkerHooks;
};

function isPermanentJobError(error: unknown): boolean {
  if (error instanceof Error && error.name === "PermanentConversionError") {
    return true;
  }

  return (
    isAppError(error) &&
    (error.code === APP_ERROR_CODES.VALIDATION_ERROR ||
      error.code === APP_ERROR_CODES.NOT_FOUND ||
      error.code === APP_ERROR_CODES.CONFLICT)
  );
}

export function createConversionWorker(
  options: CreateConversionWorkerOptions,
): ConversionWorker {
  const worker = new Worker<ConversionJobData>(
    CONVERSION_QUEUE_NAME,
    async (job) => {
      try {
        await options.processJob({
          id: job.id ?? job.data.conversionId,
          data: parseConversionJobData(job.data),
          attemptsMade: job.attemptsMade,
        });
      } catch (error) {
        if (isPermanentJobError(error)) {
          throw new UnrecoverableError(
            error instanceof Error ? error.message : "Conversion failed",
          );
        }

        throw error;
      }
    },
    {
      connection: getQueueConnection("worker"),
      concurrency: options.concurrency,
      lockDuration: options.lockDurationMs,
    },
  );

  worker.on("ready", () => {
    options.hooks?.onReady?.();
  });

  worker.on("completed", (job) => {
    options.hooks?.onCompleted?.({
      id: job.id ?? job.data.conversionId,
      conversionId: job.data.conversionId,
    });
  });

  worker.on("failed", (job, error) => {
    if (job === undefined) {
      return;
    }

    options.hooks?.onFailed?.({
      id: job.id ?? job.data.conversionId,
      conversionId: job.data.conversionId,
      attemptsMade: job.attemptsMade,
      permanent: error instanceof UnrecoverableError,
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
