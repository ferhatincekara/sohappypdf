import { APP_ERROR_CODES, AppError } from "@repo/core";
import { type ConversionRow, conversions, type Database } from "@repo/db";
import { and, eq } from "drizzle-orm";
import { normalizeFileFormat } from "./conversion-format.js";
import { parseConversionOptions } from "./conversion-options.js";
import {
  type ConversionStatus,
  isConversionStatus,
} from "./conversion-status.js";
import { isConversionType } from "./conversion-type.js";
import {
  type ConversionFailureCode,
  type ConversionRecord,
  isConversionFailureCode,
} from "./conversion-types.js";

export type ConversionStatusUpdate = {
  id: string;
  from: ConversionStatus;
  to: ConversionStatus;
  now: Date;
  outputFileId?: string | null;
  errorCode?: ConversionFailureCode | null;
  errorMessage?: string | null;
};

export type ConversionRepository = {
  insert(conversion: ConversionRecord): Promise<ConversionRecord>;
  findById(id: string): Promise<ConversionRecord | undefined>;
  findByIdempotencyKey(key: string): Promise<ConversionRecord | undefined>;
  updateStatus(
    input: ConversionStatusUpdate,
  ): Promise<ConversionRecord | undefined>;
};

function toFailureCode(value: string | null): ConversionFailureCode | null {
  if (value === null) {
    return null;
  }

  if (!isConversionFailureCode(value)) {
    throw new AppError({
      code: APP_ERROR_CODES.INTERNAL_ERROR,
      message: "Stored conversion error is invalid",
    });
  }

  return value;
}

function toConversionRecord(row: ConversionRow): ConversionRecord {
  if (!isConversionType(row.conversionType)) {
    throw new AppError({
      code: APP_ERROR_CODES.INTERNAL_ERROR,
      message: "Stored conversion type is invalid",
    });
  }

  if (!isConversionStatus(row.status)) {
    throw new AppError({
      code: APP_ERROR_CODES.INTERNAL_ERROR,
      message: "Stored conversion status is invalid",
    });
  }

  const sourceFormat = normalizeFileFormat(row.sourceFormat);
  const targetFormat = normalizeFileFormat(row.targetFormat);

  if (sourceFormat === undefined || targetFormat === undefined) {
    throw new AppError({
      code: APP_ERROR_CODES.INTERNAL_ERROR,
      message: "Stored conversion format is invalid",
    });
  }

  return {
    id: row.id,
    sourceFileId: row.sourceFileId,
    outputFileId: row.outputFileId,
    type: row.conversionType,
    sourceFormat,
    targetFormat,
    status: row.status,
    options: parseConversionOptions(row.conversionType, row.options, {
      targetFormat,
    }),
    errorCode: toFailureCode(row.errorCode),
    errorMessage: row.errorMessage,
    idempotencyKey: row.idempotencyKey,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    queuedAt: row.queuedAt,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
  };
}

export function createConversionRepository(db: Database): ConversionRepository {
  return {
    async insert(conversion) {
      const [row] = await db
        .insert(conversions)
        .values({
          id: conversion.id,
          sourceFileId: conversion.sourceFileId,
          outputFileId: conversion.outputFileId,
          conversionType: conversion.type,
          sourceFormat: conversion.sourceFormat,
          targetFormat: conversion.targetFormat,
          status: conversion.status,
          options: conversion.options,
          errorCode: conversion.errorCode,
          errorMessage: conversion.errorMessage,
          idempotencyKey: conversion.idempotencyKey,
          createdAt: conversion.createdAt,
          updatedAt: conversion.updatedAt,
          queuedAt: conversion.queuedAt,
          startedAt: conversion.startedAt,
          completedAt: conversion.completedAt,
        })
        .returning();

      if (row === undefined) {
        throw new AppError({
          code: APP_ERROR_CODES.INTERNAL_ERROR,
          message: "Failed to create conversion",
        });
      }

      return toConversionRecord(row);
    },

    async findById(id) {
      const [row] = await db
        .select()
        .from(conversions)
        .where(eq(conversions.id, id))
        .limit(1);

      if (row === undefined) {
        return undefined;
      }

      return toConversionRecord(row);
    },

    async findByIdempotencyKey(key) {
      const [row] = await db
        .select()
        .from(conversions)
        .where(eq(conversions.idempotencyKey, key))
        .limit(1);

      if (row === undefined) {
        return undefined;
      }

      return toConversionRecord(row);
    },

    async updateStatus(input) {
      const [row] = await db
        .update(conversions)
        .set({
          status: input.to,
          updatedAt: input.now,
          queuedAt: input.to === "queued" ? input.now : undefined,
          startedAt: input.to === "processing" ? input.now : undefined,
          completedAt:
            input.to === "completed" ||
            input.to === "failed" ||
            input.to === "cancelled"
              ? input.now
              : undefined,
          outputFileId: input.outputFileId,
          errorCode: input.errorCode,
          errorMessage: input.errorMessage,
        })
        .where(
          and(eq(conversions.id, input.id), eq(conversions.status, input.from)),
        )
        .returning();

      if (row === undefined) {
        return undefined;
      }

      return toConversionRecord(row);
    },
  };
}
