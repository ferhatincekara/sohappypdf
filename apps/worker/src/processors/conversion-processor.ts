import { readFile, writeFile } from "node:fs/promises";
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
import type { FileService } from "@repo/files";
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

  const object = await input.storage.getObject(input.objectKey);
  await writeFile(input.destination, object.body);
  return object.body.byteLength;
}

export function createConversionProcessor(
  dependencies: ConversionProcessorDependencies,
): (job: ConversionWorkerJob) => Promise<void> {
  return async (job) => {
    const startedAt = Date.now();
    const logger = dependencies.logger.child({
      conversionId: job.data.conversionId,
    });
    logger.info("job received");

    const conversion = await dependencies.conversions.getConversion(
      job.data.conversionId,
    );

    if (conversion.status === "completed") {
      logger.info("conversion already completed");
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

        logger.info("conversion already completed");
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

      if (parsedOptions.type === "merge-pdf") {
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

          const additionalPath = workspace.join(`additional-${index}.pdf`);
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

      logger.info("conversion started", { engine: engine.name });

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
      const outputBytes = new Uint8Array(await readFile(result.outputPath));

      await dependencies.storage.uploadObject({
        key: outputKey,
        body: outputBytes,
        contentType: result.mimeType,
      });

      const outputFile = await dependencies.files.registerStoredFile({
        id: current.id,
        ownerId: sourceFile.ownerId,
        originalFilename: result.filename,
        mimeType: result.mimeType,
        sizeBytes: output.sizeBytes,
        objectKey: outputKey,
      });

      await dependencies.conversions.markCompleted(current.id, {
        outputFileId: outputFile.id,
      });

      logger.info("conversion completed", {
        durationMs: Date.now() - startedAt,
        engine: engine.name,
        outputBytes: output.sizeBytes,
      });
    } catch (error) {
      if (isPermanentConversionError(error)) {
        await dependencies.conversions.markFailed(
          current.id,
          toSafeFailure(error),
        );
        logger.warn("conversion failed", {
          durationMs: Date.now() - startedAt,
        });
      } else {
        logger.error("conversion failed", {
          durationMs: Date.now() - startedAt,
        });
      }

      throw error;
    } finally {
      await workspace.cleanup();
    }
  };
}
