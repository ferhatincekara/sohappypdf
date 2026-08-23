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
import {
  assertConversionListLimit,
  decodeConversionListCursor,
  encodeConversionListCursor,
} from "./conversion-pagination.js";
import type { ConversionRepository } from "./conversion-repository.js";
import {
  assertConversionStatusTransition,
  type ConversionStatus,
} from "./conversion-status.js";
import type {
  ConversionListQuery,
  ConversionListResult,
  ConversionRecord,
  CreateConversionInput,
  CreateOwnedConversionInput,
  MarkConversionCompletedInput,
  MarkConversionFailedInput,
} from "./conversion-types.js";
import {
  assertConversionFailureCode,
  assertConversionId,
  assertConversionOwnerId,
  assertConversionType,
  assertFileFormat,
  assertFileReferenceId,
  assertIdempotencyKey,
  assertOwnedSourceFile,
  assertSafeErrorMessage,
} from "./conversion-validation.js";
import { fileFormatFromMimeType } from "./file-format-mime.js";
import { resolveImplementedConversionType } from "./resolve-conversion-type.js";

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
  createOwnedConversion(
    input: CreateOwnedConversionInput,
  ): Promise<ConversionRecord>;
  getConversion(id: string): Promise<ConversionRecord>;
  getOwnedConversion(id: string, ownerId: string): Promise<ConversionRecord>;
  findOwnedByIdempotencyKey(
    ownerId: string,
    idempotencyKey: string,
  ): Promise<ConversionRecord | undefined>;
  listOwnedConversions(
    query: ConversionListQuery,
  ): Promise<ConversionListResult>;
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
  cancelOwnedConversion(id: string, ownerId: string): Promise<ConversionRecord>;
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

  async function requireOwned(
    id: string,
    ownerId: string,
  ): Promise<ConversionRecord> {
    const conversion = await requireCurrent(id);

    if (conversion.ownerId !== assertConversionOwnerId(ownerId)) {
      throw new AppError({
        code: APP_ERROR_CODES.NOT_FOUND,
        message: "Conversion not found",
      });
    }

    return conversion;
  }

  async function createConversion(
    input: CreateConversionInput,
  ): Promise<ConversionRecord> {
    const ownerId = assertConversionOwnerId(input.ownerId);
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
      const existing = await options.repository.findByIdempotencyKey(
        ownerId,
        idempotencyKey,
      );

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
    const sourceFile = assertOwnedSourceFile(
      await options.files.findFileById(sourceFileId),
      ownerId,
      createdAt,
    );

    if (parsedOptions.type === "merge-pdf") {
      for (const additionalFileId of parsedOptions.additionalFileIds) {
        assertOwnedSourceFile(
          await options.files.findFileById(additionalFileId),
          ownerId,
          createdAt,
        );
      }
    }

    const conversion: ConversionRecord = {
      id: randomUUID(),
      ownerId,
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
  }

  return {
    createConversion,

    async createOwnedConversion(input) {
      const ownerId = assertConversionOwnerId(input.ownerId);
      const sourceFileId = assertFileReferenceId(input.sourceFileId);
      const targetFormat = assertFileFormat(
        input.targetFormat,
        "Invalid target format",
      );
      const createdAt = now();
      const sourceFile = assertOwnedSourceFile(
        await options.files.findFileById(sourceFileId),
        ownerId,
        createdAt,
      );
      const sourceFormat = fileFormatFromMimeType(sourceFile.mimeType);

      if (sourceFormat === undefined) {
        throw new AppError({
          code: APP_ERROR_CODES.VALIDATION_ERROR,
          message: "Unsupported conversion",
        });
      }

      const type = resolveImplementedConversionType(
        sourceFormat,
        targetFormat,
        input.type,
      );

      return createConversion({
        ownerId,
        sourceFileId: sourceFile.id,
        type,
        sourceFormat,
        targetFormat,
        idempotencyKey: input.idempotencyKey,
      });
    },

    async getConversion(id) {
      return requireCurrent(id);
    },

    async getOwnedConversion(id, ownerId) {
      return requireOwned(id, ownerId);
    },

    async findOwnedByIdempotencyKey(ownerId, idempotencyKey) {
      const key = assertIdempotencyKey(idempotencyKey);

      if (key === undefined) {
        return undefined;
      }

      return options.repository.findByIdempotencyKey(
        assertConversionOwnerId(ownerId),
        key,
      );
    },

    async listOwnedConversions(query) {
      const ownerId = assertConversionOwnerId(query.ownerId);
      const limit = assertConversionListLimit(query.limit);
      const cursor =
        query.cursor === undefined
          ? undefined
          : decodeConversionListCursor(query.cursor);
      const status = query.status;
      const targetFormat =
        query.targetFormat === undefined
          ? undefined
          : assertFileFormat(query.targetFormat, "Invalid target format");
      const records = await options.repository.listByOwner({
        ownerId,
        limit: limit + 1,
        cursor,
        status,
        targetFormat,
      });
      const hasMore = records.length > limit;
      const page = hasMore ? records.slice(0, limit) : records;
      const last = page[page.length - 1];

      return {
        conversions: page,
        nextCursor:
          hasMore && last !== undefined
            ? encodeConversionListCursor(last)
            : null,
      };
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

    async cancelOwnedConversion(id, ownerId) {
      return transition(await requireOwned(id, ownerId), "cancelled", {
        errorCode: "cancelled",
        errorMessage: "Conversion cancelled",
      });
    },
  };
}
