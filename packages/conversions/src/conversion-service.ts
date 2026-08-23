import { randomUUID } from "node:crypto";
import { APP_ERROR_CODES, AppError } from "@repo/core";
import type { FileRecord } from "@repo/files";
import {
  isConversionSupported,
  isTargetFormatAccepted,
} from "./conversion-capability.js";
import type { FileFormat } from "./conversion-format.js";
import type { ConversionOptions } from "./conversion-options.js";
import { parseConversionOptions } from "./conversion-options.js";
import type { ConversionRepository } from "./conversion-repository.js";
import {
  assertConversionStatusTransition,
  type ConversionStatus,
} from "./conversion-status.js";
import type {
  ConversionRecord,
  CreateConversionInput,
  MarkConversionCompletedInput,
  MarkConversionFailedInput,
} from "./conversion-types.js";
import {
  assertConversionFailureCode,
  assertConversionId,
  assertConversionType,
  assertFileFormat,
  assertFileReferenceId,
  assertIdempotencyKey,
  assertSafeErrorMessage,
  assertSourceFileAvailable,
} from "./conversion-validation.js";

export type ConversionFileLookup = {
  findFileById(id: string): Promise<FileRecord | undefined>;
};

export type ConversionServiceOptions = {
  repository: ConversionRepository;
  files: ConversionFileLookup;
  now?: () => Date;
};

export type ConversionService = {
  createConversion(input: CreateConversionInput): Promise<ConversionRecord>;
  getConversion(id: string): Promise<ConversionRecord>;
  updateConversionStatus(
    id: string,
    status: ConversionStatus,
  ): Promise<ConversionRecord>;
  markQueued(id: string): Promise<ConversionRecord>;
  markProcessing(id: string): Promise<ConversionRecord>;
  markCompleted(
    id: string,
    input: MarkConversionCompletedInput,
  ): Promise<ConversionRecord>;
  markFailed(
    id: string,
    input: MarkConversionFailedInput,
  ): Promise<ConversionRecord>;
  cancelConversion(id: string): Promise<ConversionRecord>;
};

function requireConversion(
  conversion: ConversionRecord | undefined,
): ConversionRecord {
  if (conversion === undefined) {
    throw new AppError({
      code: APP_ERROR_CODES.NOT_FOUND,
      message: "Conversion not found",
    });
  }

  return conversion;
}

function isSameConversionRequest(
  existing: ConversionRecord,
  input: {
    sourceFileId: string;
    type: ConversionRecord["type"];
    sourceFormat: ConversionRecord["sourceFormat"];
    targetFormat: ConversionRecord["targetFormat"];
    options: ConversionOptions;
  },
): boolean {
  return (
    existing.sourceFileId === input.sourceFileId &&
    existing.type === input.type &&
    existing.sourceFormat === input.sourceFormat &&
    existing.targetFormat === input.targetFormat &&
    JSON.stringify(existing.options) === JSON.stringify(input.options)
  );
}

function assertOcrTargetAlignment(
  options: ConversionOptions,
  targetFormat: FileFormat,
): void {
  if (options.type !== "ocr-pdf" && options.type !== "ocr-image") {
    return;
  }

  if (options.outputMode !== targetFormat) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid target format",
    });
  }
}

export function createConversionService(
  options: ConversionServiceOptions,
): ConversionService {
  const now = options.now ?? (() => new Date());

  async function requireCurrent(id: string): Promise<ConversionRecord> {
    return requireConversion(
      await options.repository.findById(assertConversionId(id)),
    );
  }

  async function transition(
    conversion: ConversionRecord,
    status: ConversionStatus,
    extra: {
      outputFileId?: string | null;
      errorCode?: MarkConversionFailedInput["errorCode"] | null;
      errorMessage?: string | null;
    } = {},
  ): Promise<ConversionRecord> {
    if (conversion.status === status) {
      return conversion;
    }

    assertConversionStatusTransition(conversion.status, status);

    const updated = await options.repository.updateStatus({
      id: conversion.id,
      from: conversion.status,
      to: status,
      now: now(),
      outputFileId: extra.outputFileId,
      errorCode: extra.errorCode,
      errorMessage: extra.errorMessage,
    });

    return requireConversion(updated);
  }

  return {
    async createConversion(input) {
      const type = assertConversionType(input.type);
      const sourceFileId = assertFileReferenceId(input.sourceFileId);
      const sourceFormat = assertFileFormat(
        input.sourceFormat,
        "Invalid source format",
      );
      const targetFormat = assertFileFormat(
        input.targetFormat,
        "Invalid target format",
      );
      const idempotencyKey = assertIdempotencyKey(input.idempotencyKey);
      const parsedOptions = parseConversionOptions(type, input.options, {
        targetFormat,
      });

      if (!isConversionSupported(type, sourceFormat, targetFormat)) {
        if (!isTargetFormatAccepted(type, targetFormat)) {
          throw new AppError({
            code: APP_ERROR_CODES.VALIDATION_ERROR,
            message: "Invalid target format",
          });
        }

        throw new AppError({
          code: APP_ERROR_CODES.VALIDATION_ERROR,
          message: "Unsupported conversion",
        });
      }

      assertOcrTargetAlignment(parsedOptions, targetFormat);

      if (parsedOptions.type === "merge-pdf") {
        if (parsedOptions.additionalFileIds.includes(sourceFileId)) {
          throw new AppError({
            code: APP_ERROR_CODES.VALIDATION_ERROR,
            message: "Invalid conversion options",
          });
        }

        for (const additionalFileId of parsedOptions.additionalFileIds) {
          assertFileReferenceId(additionalFileId);
        }
      }

      if (idempotencyKey !== undefined) {
        const existing =
          await options.repository.findByIdempotencyKey(idempotencyKey);

        if (existing !== undefined) {
          if (
            !isSameConversionRequest(existing, {
              sourceFileId,
              type,
              sourceFormat,
              targetFormat,
              options: parsedOptions,
            })
          ) {
            throw new AppError({
              code: APP_ERROR_CODES.CONFLICT,
              message: "Conversion request conflicts with an existing request",
            });
          }

          return existing;
        }
      }

      const createdAt = now();
      const sourceFile = assertSourceFileAvailable(
        await options.files.findFileById(sourceFileId),
        createdAt,
      );

      if (parsedOptions.type === "merge-pdf") {
        for (const additionalFileId of parsedOptions.additionalFileIds) {
          assertSourceFileAvailable(
            await options.files.findFileById(additionalFileId),
            createdAt,
          );
        }
      }

      const conversion: ConversionRecord = {
        id: randomUUID(),
        sourceFileId: sourceFile.id,
        outputFileId: null,
        type,
        sourceFormat,
        targetFormat,
        status: "pending",
        options: parsedOptions,
        errorCode: null,
        errorMessage: null,
        idempotencyKey: idempotencyKey ?? null,
        createdAt,
        updatedAt: createdAt,
        queuedAt: null,
        startedAt: null,
        completedAt: null,
      };

      return options.repository.insert(conversion);
    },

    async getConversion(id) {
      return requireCurrent(id);
    },

    async updateConversionStatus(id, status) {
      if (status === "completed") {
        throw new AppError({
          code: APP_ERROR_CODES.VALIDATION_ERROR,
          message: "Completed conversions require an output file",
        });
      }

      if (status === "failed") {
        throw new AppError({
          code: APP_ERROR_CODES.VALIDATION_ERROR,
          message: "Failed conversions require error information",
        });
      }

      return transition(await requireCurrent(id), status);
    },

    async markQueued(id) {
      return transition(await requireCurrent(id), "queued");
    },

    async markProcessing(id) {
      return transition(await requireCurrent(id), "processing");
    },

    async markCompleted(id, input) {
      const conversion = await requireCurrent(id);
      const outputFileId = assertFileReferenceId(input.outputFileId);
      const outputFile = await options.files.findFileById(outputFileId);

      if (outputFile === undefined || outputFile.deletedAt !== null) {
        throw new AppError({
          code: APP_ERROR_CODES.NOT_FOUND,
          message: "Output file not found",
        });
      }

      return transition(conversion, "completed", { outputFileId });
    },

    async markFailed(id, input) {
      return transition(await requireCurrent(id), "failed", {
        errorCode: assertConversionFailureCode(input.errorCode),
        errorMessage: assertSafeErrorMessage(input.errorMessage),
      });
    },

    async cancelConversion(id) {
      return transition(await requireCurrent(id), "cancelled", {
        errorCode: "cancelled",
        errorMessage: "Conversion cancelled",
      });
    },
  };
}
