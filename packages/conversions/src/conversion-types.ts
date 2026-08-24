import type { ResourceOwnerKind } from "@repo/files";
import type { FileFormat } from "./conversion-format.js";
import type { ConversionOptions } from "./conversion-options.js";
import type { ConversionStatus } from "./conversion-status.js";
import type { ConversionType } from "./conversion-type.js";

export const DEFAULT_CONVERSION_LIST_LIMIT = 20;
export const MAX_CONVERSION_LIST_LIMIT = 50;

export const CONVERSION_FAILURE_CODES = [
  "unsupported_conversion",
  "invalid_source_format",
  "invalid_target_format",
  "invalid_options",
  "source_file_unavailable",
  "output_file_unavailable",
  "processing_failed",
  "cancelled",
] as const;

export type ConversionFailureCode = (typeof CONVERSION_FAILURE_CODES)[number];

export function isConversionFailureCode(
  value: string,
): value is ConversionFailureCode {
  return CONVERSION_FAILURE_CODES.some((code) => code === value);
}

export type ConversionRecord = {
  id: string;
  ownerId: string;
  ownerKind?: ResourceOwnerKind;
  sourceFileId: string;
  outputFileId: string | null;
  type: ConversionType;
  sourceFormat: FileFormat;
  targetFormat: FileFormat;
  status: ConversionStatus;
  options: ConversionOptions;
  errorCode: ConversionFailureCode | null;
  errorMessage: string | null;
  idempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
  queuedAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  expiresAt?: Date | null;
};

export type CreateConversionInput = {
  ownerId: string;
  ownerKind?: ResourceOwnerKind;
  sourceFileId: string;
  type: ConversionType;
  sourceFormat: string;
  targetFormat: string;
  options?: unknown;
  idempotencyKey?: string;
  expiresAt?: Date | null;
};

export type CreateOwnedConversionInput = {
  ownerId: string;
  ownerKind?: ResourceOwnerKind;
  sourceFileId: string;
  targetFormat: string;
  type?: string;
  options?: unknown;
  idempotencyKey?: string;
  expiresAt?: Date | null;
};

export type ConversionListQuery = {
  ownerId: string;
  limit?: number;
  cursor?: string;
  status?: ConversionStatus;
  targetFormat?: string;
};

export type ConversionListResult = {
  conversions: ConversionRecord[];
  nextCursor: string | null;
};

export type MarkConversionFailedInput = {
  errorCode: ConversionFailureCode;
  errorMessage: string;
};

export type MarkConversionCompletedInput = {
  outputFileId: string;
};
