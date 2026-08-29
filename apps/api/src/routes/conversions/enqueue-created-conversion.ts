import type {
  ConversionRecord,
  ConversionService,
  CreateOwnedConversionInput,
} from "@sohappypdf/conversions";
import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import type { FileRecord } from "@sohappypdf/files";
import type { Logger } from "@sohappypdf/logger";
import {
  type ConversionJobData,
  toQueueSafeJobOptions,
} from "@sohappypdf/queue";

export type EnqueueCreatedConversionOptions = {
  conversions: ConversionService;
  findFileById: (id: string) => Promise<FileRecord | undefined>;
  enqueue: (input: ConversionJobData) => Promise<unknown>;
  logger: Logger;
  input: CreateOwnedConversionInput;
};

function isDuplicateQueueJob(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("already exists") || message.includes("already present")
  );
}

export async function enqueueCreatedConversion(
  options: EnqueueCreatedConversionOptions,
): Promise<ConversionRecord> {
  const conversion = await options.conversions.createOwnedConversion(
    options.input,
  );

  if (conversion.status !== "pending") {
    return conversion;
  }

  const sourceFile = await options.findFileById(conversion.sourceFileId);

  if (sourceFile === undefined) {
    throw new AppError({
      code: APP_ERROR_CODES.INTERNAL_ERROR,
      message: "Conversion could not be queued",
    });
  }

  try {
    await options.enqueue({
      conversionId: conversion.id,
      sourceFileId: conversion.sourceFileId,
      sourceObjectKey: sourceFile.objectKey,
      conversionType: conversion.type,
      sourceFormat: conversion.sourceFormat,
      targetFormat: conversion.targetFormat,
      options: toQueueSafeJobOptions(conversion.options),
    });
  } catch (error) {
    if (isDuplicateQueueJob(error)) {
      options.logger.info("conversion job already enqueued", {
        conversionId: conversion.id,
        sourceFileId: conversion.sourceFileId,
        userId: conversion.ownerId,
      });
    } else {
      options.logger.error("conversion queue failed", {
        conversionId: conversion.id,
        sourceFileId: conversion.sourceFileId,
        userId: conversion.ownerId,
        targetFormat: conversion.targetFormat,
      });

      try {
        await options.conversions.markFailed(conversion.id, {
          errorCode: "processing_failed",
          errorMessage: "Conversion could not be queued",
        });
      } catch {
        options.logger.error("conversion queue failure could not be recorded", {
          conversionId: conversion.id,
          userId: conversion.ownerId,
        });
      }

      throw new AppError({
        code: APP_ERROR_CODES.INTERNAL_ERROR,
        message: "Conversion could not be queued",
        cause: error,
      });
    }
  }

  try {
    return await options.conversions.markQueued(conversion.id);
  } catch {
    options.logger.error("conversion queued but status update failed", {
      conversionId: conversion.id,
      userId: conversion.ownerId,
    });

    return conversion;
  }
}
