import { APP_ERROR_CODES, AppError } from "@repo/core";
import { type EnvSource, getOptionalEnv } from "./env.js";

const MIB = 1024 * 1024;

export const DEFAULT_ANONYMOUS_MAX_FILE_SIZE_BYTES = 25 * MIB;
export const DEFAULT_ANONYMOUS_MAX_FILES_PER_OPERATION = 5;
export const DEFAULT_ANONYMOUS_OPERATIONS_PER_HOUR = 10;
export const DEFAULT_ANONYMOUS_RETENTION_HOURS = 2;
export const DEFAULT_ANONYMOUS_RETENTION_MS =
  DEFAULT_ANONYMOUS_RETENTION_HOURS * 60 * 60 * 1000;

export type AnonymousConfig = {
  maxFileSizeBytes: number;
  maxFilesPerOperation: number;
  operationsPerHour: number;
  retentionMs: number;
};

export const DEFAULT_ANONYMOUS_CONFIG: AnonymousConfig = {
  maxFileSizeBytes: DEFAULT_ANONYMOUS_MAX_FILE_SIZE_BYTES,
  maxFilesPerOperation: DEFAULT_ANONYMOUS_MAX_FILES_PER_OPERATION,
  operationsPerHour: DEFAULT_ANONYMOUS_OPERATIONS_PER_HOUR,
  retentionMs: DEFAULT_ANONYMOUS_RETENTION_MS,
};

function parsePositiveInteger(
  name: string,
  value: string | undefined,
  fallback: number,
): number {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new AppError({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message: `Invalid ${name}`,
    });
  }

  return parsed;
}

export function loadAnonymousConfig(
  source: EnvSource = process.env,
): AnonymousConfig {
  const retentionHours = parsePositiveInteger(
    "ANONYMOUS_RETENTION_HOURS",
    getOptionalEnv("ANONYMOUS_RETENTION_HOURS", source),
    DEFAULT_ANONYMOUS_RETENTION_HOURS,
  );

  return {
    maxFileSizeBytes: parsePositiveInteger(
      "ANONYMOUS_MAX_FILE_SIZE_BYTES",
      getOptionalEnv("ANONYMOUS_MAX_FILE_SIZE_BYTES", source),
      DEFAULT_ANONYMOUS_MAX_FILE_SIZE_BYTES,
    ),
    maxFilesPerOperation: parsePositiveInteger(
      "ANONYMOUS_MAX_FILES_PER_OPERATION",
      getOptionalEnv("ANONYMOUS_MAX_FILES_PER_OPERATION", source),
      DEFAULT_ANONYMOUS_MAX_FILES_PER_OPERATION,
    ),
    operationsPerHour: parsePositiveInteger(
      "ANONYMOUS_OPERATIONS_PER_HOUR",
      getOptionalEnv("ANONYMOUS_OPERATIONS_PER_HOUR", source),
      DEFAULT_ANONYMOUS_OPERATIONS_PER_HOUR,
    ),
    retentionMs: retentionHours * 60 * 60 * 1000,
  };
}
