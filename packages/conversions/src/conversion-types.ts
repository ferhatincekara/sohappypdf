import type { FileFormat } from "./conversion-format.js";
import type { ConversionOptions } from "./conversion-options.js";
import type { ConversionStatus } from "./conversion-status.js";
import type { ConversionType } from "./conversion-type.js";

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
};

export type CreateConversionInput = {
  sourceFileId: string;
  type: ConversionType;
  sourceFormat: string;
  targetFormat: string;
  options?: unknown;
  idempotencyKey?: string;
};

export type MarkConversionFailedInput = {
  errorCode: ConversionFailureCode;
  errorMessage: string;
};

export type MarkConversionCompletedInput = {
  outputFileId: string;
};
