import { APP_ERROR_CODES, AppError } from "@repo/core";
import { type EnvSource, getOptionalEnv } from "./env.js";

export const DEFAULT_FILE_RETENTION_HOURS = 2;
export const DEFAULT_FILE_RETENTION_MS =
  DEFAULT_FILE_RETENTION_HOURS * 60 * 60 * 1000;
export const DEFAULT_FILE_CLEANUP_BATCH_SIZE = 100;
export const MAX_FILE_CLEANUP_BATCH_SIZE = 100;

export type FileConfig = {
  maxUploadFileSizeBytes: number;
  retentionMs: number;
  cleanupBatchSize: number;
};

export const DEFAULT_FILE_CONFIG: FileConfig = {
  maxUploadFileSizeBytes: 100 * 1024 * 1024,
  retentionMs: DEFAULT_FILE_RETENTION_MS,
  cleanupBatchSize: DEFAULT_FILE_CLEANUP_BATCH_SIZE,
};

function parsePositiveInteger(
  name: string,
  value: string | undefined,
  fallback: number,
  maximum?: number,
): number {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < 1 ||
    (maximum !== undefined && parsed > maximum)
  ) {
    throw new AppError({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message: `Invalid ${name}`,
    });
  }

  return parsed;
}

export function loadFileConfig(source: EnvSource = process.env): FileConfig {
  const retentionHours = parsePositiveInteger(
    "FILE_RETENTION_HOURS",
    getOptionalEnv("FILE_RETENTION_HOURS", source),
    DEFAULT_FILE_RETENTION_HOURS,
  );

  return {
    maxUploadFileSizeBytes: parsePositiveInteger(
      "MAX_UPLOAD_FILE_SIZE",
      getOptionalEnv("MAX_UPLOAD_FILE_SIZE", source),
      DEFAULT_FILE_CONFIG.maxUploadFileSizeBytes,
    ),
    retentionMs: retentionHours * 60 * 60 * 1000,
    cleanupBatchSize: parsePositiveInteger(
      "FILE_CLEANUP_BATCH_SIZE",
      getOptionalEnv("FILE_CLEANUP_BATCH_SIZE", source),
      DEFAULT_FILE_CLEANUP_BATCH_SIZE,
      MAX_FILE_CLEANUP_BATCH_SIZE,
    ),
  };
}
