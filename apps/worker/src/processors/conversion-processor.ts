import type { BillingService } from "@sohappypdf/billing";
import { DEFAULT_PLAN_LIMITS } from "@sohappypdf/billing/plans";
import type { WorkerConfig } from "@sohappypdf/config";
import type { EngineRegistry } from "@sohappypdf/conversion-engines";
import {
  countPdfPagesFromPath,
  createConversionWorkspace,
  isPermanentConversionError,
  PermanentConversionError,
  toSafeFailure,
  validateConversionOutput,
} from "@sohappypdf/conversion-engines";
import {
  type ConversionService,
  fileFormatFromFilename,
  isConversionImplemented,
  isConversionType,
  parseConversionOptions,
} from "@sohappypdf/conversions";
import { APP_ERROR_CODES, isAppError } from "@sohappypdf/core";
import {
  DEFAULT_RESOURCE_OWNER_KIND,
  type FileService,
  remainingFileTtlMs,
} from "@sohappypdf/files";
import type { Logger } from "@sohappypdf/logger";
import type { ConversionWorkerJob } from "@sohappypdf/queue";
import { createFileOutputKey, type Storage } from "@sohappypdf/storage";
import { isDatabaseFallbackJob } from "./pending-conversion-poller.js";

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

async function resolveMaxPagesPerFile(input: {
  billing?: BillingService;
  ownerId: string;
  ownerKind?: string;
}): Promise<number | null> {
  if (input.ownerKind === "user" && input.billing !== undefined) {
    const entitlements = await input.billing.getEntitlements(input.ownerId);
    return entitlements.limits.maxPagesPerFile;
  }

  return DEFAULT_PLAN_LIMITS.free.maxPagesPerFile;
}

async function assertPdfPageLimit(input: {
  path: string;
  maxPagesPerFile: number | null;
}): Promise<void> {
  if (input.maxPagesPerFile === null) {
    return;
  }

  const pageCount = await countPdfPagesFromPath(input.path);
  if (pageCount > input.maxPagesPerFile) {
    throw new PermanentConversionError(
      "processing_failed",
      `File exceeds the ${String(input.maxPagesPerFile)} page limit`,
    );
  }
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

    if (isDatabaseFallbackJob(job.id) && conversion.status === "processing") {
      jobLogger.info("conversion already processing");
      return;
    }

    let current = conversion;

    try {
      if (current.status === "pending") {
        current = await dependencies.conversions.markQueued(current.id);
      }

      if (current.status === "queued") {
        current = await dependencies.conversions.markProcessing(current.id);
      }
    } catch (error) {
      if (isLostConversionClaim(error)) {
        jobLogger.info("conversion already claimed");
        return;
      }

      throw error;
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
        current.options,
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

      const maxPagesPerFile = await resolveMaxPagesPerFile({
        billing: dependencies.billing,
        ownerId: current.ownerId,
        ownerKind: current.ownerKind,
      });

      if (conversion.sourceFormat === "pdf") {
        await assertPdfPageLimit({
          path: sourcePath,
          maxPagesPerFile,
        });
      }

      for (const additionalPath of additionalSourcePaths) {
        if (additionalPath.endsWith(".pdf")) {
          await assertPdfPageLimit({
            path: additionalPath,
            maxPagesPerFile,
          });
        }
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
        expectedFormat:
          fileFormatFromFilename(result.filename) ?? conversion.targetFormat,
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

        if (isDatabaseFallbackJob(job.id)) {
          await markFallbackJobFailed(dependencies.conversions, current.id);
        }
      }

      throw error;
    } finally {
      await workspace.cleanup();
    }
  };
}

function isLostConversionClaim(error: unknown): boolean {
  return isAppError(error) && error.code === APP_ERROR_CODES.NOT_FOUND;
}

async function markFallbackJobFailed(
  conversions: ConversionService,
  conversionId: string,
): Promise<void> {
  try {
    const latest = await conversions.getConversion(conversionId);

    if (latest.status !== "queued" && latest.status !== "processing") {
      return;
    }

    await conversions.markFailed(conversionId, {
      errorCode: "processing_failed",
      errorMessage: "Conversion could not be processed",
    });
  } catch {
    return;
  }
}
