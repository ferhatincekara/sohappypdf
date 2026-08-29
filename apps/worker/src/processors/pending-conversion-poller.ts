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
  isShuttingDown?: () => boolean;
}): PendingConversionPoller {
  const intervalMs = options.intervalMs ?? PENDING_CONVERSION_POLL_INTERVAL_MS;
  const batchSize = options.batchSize ?? PENDING_CONVERSION_POLL_BATCH_SIZE;
  let inFlight = false;

  const tick = async (): Promise<void> => {
    if (inFlight || options.isShuttingDown?.() === true) {
      return;
    }

    inFlight = true;

    try {
      const pending =
        await options.conversions.listPendingForProcessing(batchSize);

      for (const conversion of pending) {
        if (options.isShuttingDown?.() === true) {
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
  const sourceFile = await options.files.findFileById(conversion.sourceFileId);

  if (sourceFile === undefined || sourceFile.deletedAt !== null) {
    await options.conversions.markFailed(conversion.id, {
      errorCode: "source_file_unavailable",
      errorMessage: "Source file unavailable",
    });
    return;
  }

  await options.processJob({
    id: `db:${conversion.id}`,
    data: {
      conversionId: conversion.id,
      sourceFileId: conversion.sourceFileId,
      sourceObjectKey: sourceFile.objectKey,
      conversionType: conversion.type,
      sourceFormat: conversion.sourceFormat,
      targetFormat: conversion.targetFormat,
      options: toQueueSafeJobOptions(conversion.options),
    },
    attemptsMade: 0,
  });
}
