import type {
  ConversionRecord,
  ConversionService,
} from "@sohappypdf/conversions";
import type { FileService } from "@sohappypdf/files";
import type { Logger } from "@sohappypdf/logger";
import {
  type ConversionJobProcessor,
  toQueueSafeJobOptions,
} from "@sohappypdf/queue";

export const PENDING_CONVERSION_POLL_INTERVAL_MS = 2_000;
export const PENDING_CONVERSION_POLL_BATCH_SIZE = 5;
export const PENDING_CONVERSION_MIN_AGE_MS = 15_000;
export const DATABASE_FALLBACK_JOB_PREFIX = "db:";

export function isDatabaseFallbackJob(jobId: string): boolean {
  return jobId.startsWith(DATABASE_FALLBACK_JOB_PREFIX);
}

export type PendingConversionPoller = {
  stop(): void;
};

export function startPendingConversionPoller(options: {
  conversions: ConversionService;
  files: FileService;
  processJob: ConversionJobProcessor;
  logger: Logger;
  intervalMs?: number;
  batchSize?: number;
  minAgeMs?: number;
  isShuttingDown?: () => boolean;
}): PendingConversionPoller {
  const intervalMs = options.intervalMs ?? PENDING_CONVERSION_POLL_INTERVAL_MS;
  const batchSize = options.batchSize ?? PENDING_CONVERSION_POLL_BATCH_SIZE;
  const minAgeMs = options.minAgeMs ?? 0;
  let inFlight = false;
  let stopped = false;

  const tick = async (): Promise<void> => {
    if (stopped || inFlight || options.isShuttingDown?.() === true) {
      return;
    }

    inFlight = true;

    try {
      const pending = await options.conversions.listPendingForProcessing(
        batchSize,
        minAgeMs,
      );

      for (const conversion of pending) {
        if (stopped || options.isShuttingDown?.() === true) {
          return;
        }

        await processPendingConversion(conversion, options);
      }
    } catch {
      options.logger.warn("pending conversion poll failed");
    } finally {
      inFlight = false;
    }
  };

  const timer = setInterval(() => {
    void tick();
  }, intervalMs);
  void tick();

  return {
    stop() {
      stopped = true;
      clearInterval(timer);
    },
  };
}

async function processPendingConversion(
  conversion: ConversionRecord,
  options: {
    conversions: ConversionService;
    files: FileService;
    processJob: ConversionJobProcessor;
    logger: Logger;
  },
): Promise<void> {
  const claimed =
    conversion.status === "queued"
      ? conversion
      : await options.conversions.claimPendingForProcessing(conversion.id);

  if (claimed === undefined) {
    return;
  }

  const sourceFile = await options.files.findFileById(claimed.sourceFileId);

  if (sourceFile === undefined || sourceFile.deletedAt !== null) {
    await options.conversions.markFailed(claimed.id, {
      errorCode: "source_file_unavailable",
      errorMessage: "Source file unavailable",
    });
    return;
  }

  try {
    await options.processJob({
      id: `${DATABASE_FALLBACK_JOB_PREFIX}${claimed.id}`,
      data: {
        conversionId: claimed.id,
        sourceFileId: claimed.sourceFileId,
        sourceObjectKey: sourceFile.objectKey,
        conversionType: claimed.type,
        sourceFormat: claimed.sourceFormat,
        targetFormat: claimed.targetFormat,
        options: toQueueSafeJobOptions(claimed.options),
      },
      attemptsMade: 0,
    });
  } catch {
    options.logger.warn("pending conversion fallback failed", {
      conversionId: claimed.id,
    });

    try {
      const current = await options.conversions.getConversion(claimed.id);

      if (current.status === "queued") {
        await options.conversions.markFailed(claimed.id, {
          errorCode: "processing_failed",
          errorMessage: "Conversion could not be processed",
        });
      }
    } catch {
      options.logger.error("pending conversion failure could not be recorded", {
        conversionId: claimed.id,
      });
    }
  }
}
