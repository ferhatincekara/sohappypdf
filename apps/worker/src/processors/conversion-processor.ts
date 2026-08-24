import type { BillingService } from "@repo/billing";
import type { WorkerConfig } from "@repo/config";
import type { EngineRegistry } from "@repo/conversion-engines";
import {
  createConversionWorkspace,
  isPermanentConversionError,
  PermanentConversionError,
  toSafeFailure,
  validateConversionOutput,
} from "@repo/conversion-engines";
import {
  type ConversionService,
  isConversionImplemented,
  isConversionType,
  parseConversionOptions,
} from "@repo/conversions";
import {
  DEFAULT_RESOURCE_OWNER_KIND,
  type FileService,
  remainingFileTtlMs,
} from "@repo/files";
import type { Logger } from "@repo/logger";
import type { ConversionWorkerJob } from "@repo/queue";
import { createFileOutputKey, type Storage } from "@repo/storage";

export type ConversionProcessorDependencies = {
  conversions: ConversionService;
  files: FileService;
  storage: Storage;
  engines: EngineRegistry;
  config: WorkerConfig;
  logger: Logger;
  billing?: BillingService;
};

async function downloadToFile(input: {
  storage: Storage;
  objectKey: string;
  destination: string;
  maxBytes: number;
}): Promise<number> {
  const metadata = await input.storage.getObjectMetadata(input.objectKey);

  if (metadata === undefined) {
    throw new PermanentConversionError(
      "source_file_unavailable",
      "Source file unavailable",
    );
  }

  if (metadata.contentLength > input.maxBytes) {
    throw new PermanentConversionError(
      "processing_failed",
      "Source file exceeds the worker size limit",
    );
  }

  const downloaded = await input.storage.downloadObjectToFile({
    key: input.objectKey,
    destination: input.destination,
    maxBytes: input.maxBytes,
  });
  return downloaded.sizeBytes;
}

export function createConversionProcessor(
  dependencies: ConversionProcessorDependencies,
): (job: ConversionWorkerJob) => Promise<void> {
  return async (job) => {
    const startedAt = Date.now();
    const logger = dependencies.logger.child({
      jobId: job.id,
      conversionId: job.data.conversionId,
    });
    logger.info("job received");

    const conversion = await dependencies.conversions.getConversion(
      job.data.conversionId,
    );

    const jobLogger = logger.child({ ownerId: conversion.ownerId });

    if (conversion.status === "completed") {
      jobLogger.info("conversion already completed");
      return;
    }

    if (conversion.status === "cancelled") {
      throw new PermanentConversionError("cancelled", "Conversion cancelled");
    }

    if (conversion.status === "failed") {
      throw new PermanentConversionError(
        "processing_failed",
        "Conversion already failed",
      );
    }

    if (conversion.sourceFileId !== job.data.sourceFileId) {
      throw new PermanentConversionError(
        "source_file_unavailable",
        "Source file unavailable",
      );
    }

    let current = conversion;

    if (current.status === "pending") {
      current = await dependencies.conversions.markQueued(current.id);
    }

    if (current.status === "queued") {
      current = await dependencies.conversions.markProcessing(current.id);
    }

    const existingOutput = await dependencies.files.findFileById(current.id);

    if (existingOutput !== undefined) {
      const exists = await dependencies.storage.objectExists(
        existingOutput.objectKey,
      );

      if (exists) {
        if (current.status !== "completed") {
          await dependencies.conversions.markCompleted(current.id, {
            outputFileId: existingOutput.id,
          });
        }

        jobLogger.info("conversion already completed");
        return;
      }
    }

    const workspace = await createConversionWorkspace(current.id);

    try {
      if (!isConversionType(job.data.conversionType)) {
        throw new PermanentConversionError(
          "unsupported_conversion",
          "Unsupported conversion",
        );
      }

      if (!isConversionImplemented(job.data.conversionType)) {
        throw new PermanentConversionError(
          "unsupported_conversion",
          "Unsupported conversion",
        );
      }

      const parsedOptions = parseConversionOptions(
        job.data.conversionType,
        job.data.options,
        { targetFormat: conversion.targetFormat },
      );
      const engine = dependencies.engines.resolve({
        type: job.data.conversionType,
        sourceFormat: conversion.sourceFormat,
        targetFormat: conversion.targetFormat,
      });
      const sourceFile = await dependencies.files.findFileById(
        current.sourceFileId,
      );

      if (
        sourceFile === undefined ||
        sourceFile.objectKey !== job.data.sourceObjectKey
      ) {
        throw new PermanentConversionError(
          "source_file_unavailable",
          "Source file unavailable",
        );
      }

      const sourcePath = workspace.join(`source.${conversion.sourceFormat}`);
      let writtenBytes = await downloadToFile({
        storage: dependencies.storage,
        objectKey: sourceFile.objectKey,
        destination: sourcePath,
        maxBytes: dependencies.config.maxInputFileSizeBytes,
      });

      const additionalSourcePaths: string[] = [];

      if (
        "additionalFileIds" in parsedOptions &&
        Array.isArray(parsedOptions.additionalFileIds)
      ) {
        for (const [
          index,
          fileId,
        ] of parsedOptions.additionalFileIds.entries()) {
          const additional = await dependencies.files.findFileById(fileId);

          if (additional === undefined) {
            throw new PermanentConversionError(
              "source_file_unavailable",
              "Source file unavailable",
            );
          }

          const extension =
            additional.mimeType === "image/png"
              ? "png"
              : additional.mimeType === "image/jpeg"
                ? "jpg"
                : "pdf";
          const additionalPath = workspace.join(
            `additional-${index}.${extension}`,
          );
          writtenBytes += await downloadToFile({
            storage: dependencies.storage,
            objectKey: additional.objectKey,
            destination: additionalPath,
            maxBytes: dependencies.config.maxInputFileSizeBytes,
          });
          additionalSourcePaths.push(additionalPath);
        }
      }

      if (writtenBytes > dependencies.config.maxTempDiskUsageBytes) {
        throw new PermanentConversionError(
          "processing_failed",
          "Temporary disk limit exceeded",
        );
      }

      jobLogger.info("conversion started", { engine: engine.name });

      const result = await engine.convert({
        type: job.data.conversionType,
        sourcePath,
        outputDirectory: workspace.directory,
        sourceFormat: conversion.sourceFormat,
        targetFormat: conversion.targetFormat,
        options: parsedOptions,
        additionalSourcePaths,
      });

      const output = await validateConversionOutput({
        outputPath: result.outputPath,
        expectedFormat: conversion.targetFormat,
        maxBytes: dependencies.config.maxOutputFileSizeBytes,
      });

      const outputKey = createFileOutputKey(current.sourceFileId, current.id);

      await dependencies.storage.uploadObjectFromFile({
        key: outputKey,
        filePath: result.outputPath,
        contentType: result.mimeType,
      });

      const outputFile = await dependencies.files.registerStoredFile({
        id: current.id,
        ownerId: sourceFile.ownerId,
        ownerKind: sourceFile.ownerKind ?? DEFAULT_RESOURCE_OWNER_KIND,
        originalFilename: result.filename,
        mimeType: result.mimeType,
        sizeBytes: output.sizeBytes,
        objectKey: outputKey,
        expiresInMs: remainingFileTtlMs(sourceFile),
      });

      await dependencies.conversions.markCompleted(current.id, {
        outputFileId: outputFile.id,
      });

      jobLogger.info("conversion completed", {
        durationMs: Date.now() - startedAt,
        engine: engine.name,
        outputBytes: output.sizeBytes,
      });
    } catch (error) {
      if (isPermanentConversionError(error)) {
        const failure = toSafeFailure(error);
        await dependencies.conversions.markFailed(current.id, failure);

        if (dependencies.billing !== undefined) {
          try {
            await dependencies.billing.refundWebCreditsForFailure({
              userId: conversion.ownerId,
              conversionId: current.id,
              errorCode: failure.errorCode,
            });
            await dependencies.billing.refundAiCreditsForFailure({
              userId: conversion.ownerId,
              conversionId: current.id,
              errorCode: failure.errorCode,
            });
            await dependencies.billing.refundApiCreditsForFailure({
              userId: conversion.ownerId,
              conversionId: current.id,
              errorCode: failure.errorCode,
            });
          } catch (refundError) {
            jobLogger.error("credit refund failed", {
              conversionId: current.id,
            });
            jobLogger.debug("credit refund error", {
              conversionId: current.id,
              error:
                refundError instanceof Error
                  ? refundError.message
                  : "unknown error",
            });
          }
        }

        jobLogger.warn("conversion failed", {
          durationMs: Date.now() - startedAt,
          errorCode: failure.errorCode,
          ...(error.details === undefined ? {} : { details: error.details }),
        });
      } else {
        jobLogger.error("conversion failed", {
          durationMs: Date.now() - startedAt,
        });
      }

      throw error;
    } finally {
      await workspace.cleanup();
    }
  };
}
