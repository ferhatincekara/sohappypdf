import { type EnvSource, getOptionalEnv } from "./env.js";
import { parsePositiveInteger } from "./parse-positive-integer.js";

const MIB = 1024 * 1024;

export const DEFAULT_ANONYMOUS_MAX_FILE_SIZE_BYTES = 20 * MIB;
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
