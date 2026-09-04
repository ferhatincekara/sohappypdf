import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import { type ConversionRow, conversions, type Database } from "@sohappypdf/db";
import {
  DEFAULT_RESOURCE_OWNER_KIND,
  type ResourceOwnerTransferInput,
  type ResourceOwnerTransferResult,
} from "@sohappypdf/files";
import { and, asc, desc, eq, gt, isNull, lt, lte, or, sql } from "drizzle-orm";
import { normalizeFileFormat } from "./conversion-format.js";
import { parseConversionOptions } from "./conversion-options.js";
import type { ConversionListCursor } from "./conversion-pagination.js";
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

export type ConversionOwnerListInput = {
  ownerId: string;
  ownerKind?: ConversionRecord["ownerKind"];
  limit: number;
  cursor?: ConversionListCursor;
  status?: ConversionStatus;
  targetFormat?: string;
  now?: Date;
  activeAfter?: Date;
};

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
  findByIdempotencyKey(
    ownerId: string,
    key: string,
  ): Promise<ConversionRecord | undefined>;
  listByOwner(input: ConversionOwnerListInput): Promise<ConversionRecord[]>;
  updateStatus(
    input: ConversionStatusUpdate,
  ): Promise<ConversionRecord | undefined>;
  deleteById(id: string): Promise<void>;
  deleteReferencingFile(fileId: string): Promise<number>;
  listExpired(input: {
    now: Date;
    activeAfter: Date;
    limit: number;
  }): Promise<ConversionRecord[]>;
  listPendingForProcessing(input: {
    now: Date;
    activeAfter: Date;
    limit: number;
    staleBefore?: Date;
  }): Promise<ConversionRecord[]>;
  transferOwner(
    input: ResourceOwnerTransferInput,
  ): Promise<ResourceOwnerTransferResult>;
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
    ownerId: row.ownerId,
    ownerKind: row.ownerKind,
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
    expiresAt: row.expiresAt,
  };
}

export function createConversionRepository(db: Database): ConversionRepository {
  return {
    async insert(conversion) {
      const [row] = await db
        .insert(conversions)
        .values({
          id: conversion.id,
          ownerId: conversion.ownerId,
          ownerKind: conversion.ownerKind ?? DEFAULT_RESOURCE_OWNER_KIND,
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
          expiresAt: conversion.expiresAt ?? null,
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

    async findByIdempotencyKey(ownerId, key) {
      const [row] = await db
        .select()
        .from(conversions)
        .where(
          and(
            eq(conversions.ownerId, ownerId),
            eq(conversions.idempotencyKey, key),
          ),
        )
        .limit(1);

      if (row === undefined) {
        return undefined;
      }

      return toConversionRecord(row);
    },

    async listByOwner(input) {
      const conditions = [eq(conversions.ownerId, input.ownerId)];

      if (input.ownerKind !== undefined) {
        conditions.push(eq(conversions.ownerKind, input.ownerKind));
      }

      if (input.now !== undefined && input.activeAfter !== undefined) {
        const activeExpiry = or(
          gt(conversions.expiresAt, input.now),
          and(
            isNull(conversions.expiresAt),
            gt(conversions.createdAt, input.activeAfter),
          ),
        );

        if (activeExpiry !== undefined) {
          conditions.push(activeExpiry);
        }
      }

      if (input.status !== undefined) {
        conditions.push(eq(conversions.status, input.status));
      }

      if (input.targetFormat !== undefined) {
        conditions.push(eq(conversions.targetFormat, input.targetFormat));
      }

      if (input.cursor !== undefined) {
        const cursorFilter = or(
          lt(conversions.createdAt, input.cursor.createdAt),
          and(
            eq(conversions.createdAt, input.cursor.createdAt),
            lt(conversions.id, input.cursor.id),
          ),
        );

        if (cursorFilter !== undefined) {
          conditions.push(cursorFilter);
        }
      }

      const rows = await db
        .select()
        .from(conversions)
        .where(and(...conditions))
        .orderBy(desc(conversions.createdAt), desc(conversions.id))
        .limit(input.limit);

      return rows.map((row) => toConversionRecord(row));
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

    async deleteById(id) {
      await db.delete(conversions).where(eq(conversions.id, id));
    },

    async deleteReferencingFile(fileId) {
      const deleted = await db
        .delete(conversions)
        .where(
          or(
            eq(conversions.sourceFileId, fileId),
            eq(conversions.outputFileId, fileId),
          ),
        )
        .returning({ id: conversions.id });

      return deleted.length;
    },

    async listPendingForProcessing(input) {
      const activeExpiry = or(
        gt(conversions.expiresAt, input.now),
        and(
          isNull(conversions.expiresAt),
          gt(conversions.createdAt, input.activeAfter),
        ),
      );
      const statusCondition =
        input.staleBefore === undefined
          ? eq(conversions.status, "pending")
          : or(
              eq(conversions.status, "pending"),
              and(
                eq(conversions.status, "queued"),
                isNull(conversions.startedAt),
              ),
            );
      const conditions = [statusCondition, activeExpiry];

      if (input.staleBefore !== undefined) {
        conditions.push(lte(conversions.createdAt, input.staleBefore));
      }

      const rows = await db
        .select()
        .from(conversions)
        .where(and(...conditions))
        .orderBy(asc(conversions.createdAt), asc(conversions.id))
        .limit(input.limit);

      return rows.map((row) => toConversionRecord(row));
    },

    async listExpired(input) {
      const rows = await db
        .select()
        .from(conversions)
        .where(
          or(
            and(
              sql`${conversions.expiresAt} is not null`,
              lte(conversions.expiresAt, input.now),
            ),
            and(
              isNull(conversions.expiresAt),
              lte(conversions.createdAt, input.activeAfter),
            ),
          ),
        )
        .limit(input.limit);

      return rows.map((row) => toConversionRecord(row));
    },

    async transferOwner(input) {
      const updated = await db
        .update(conversions)
        .set({
          ownerId: input.toOwnerId,
          ownerKind: input.toOwnerKind,
          updatedAt: input.now,
        })
        .where(
          and(
            eq(conversions.ownerId, input.fromOwnerId),
            eq(conversions.ownerKind, input.fromOwnerKind),
          ),
        )
        .returning({ id: conversions.id });

      return { transferred: updated.length };
    },
  };
}
