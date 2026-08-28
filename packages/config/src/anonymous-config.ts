import { type EnvSource, getOptionalEnv } from "./env.js";
import { parsePositiveInteger } from "./parse-positive-integer.js";

const MIB = 1024 * 1024;

export const DEFAULT_ANONYMOUS_MAX_FILE_SIZE_BYTES = 25 * MIB;
export const DEFAULT_ANONYMOUS_MAX_FILES_PER_OPERATION = 1;
export const DEFAULT_ANONYMOUS_OPERATIONS_PER_DAY = 5;
export const DEFAULT_ANONYMOUS_MAX_PAGES_PER_FILE = 50;
export const DEFAULT_ANONYMOUS_RETENTION_HOURS = 2;
export const DEFAULT_ANONYMOUS_RETENTION_MS =
  DEFAULT_ANONYMOUS_RETENTION_HOURS * 60 * 60 * 1000;

export type AnonymousConfig = {
  maxFileSizeBytes: number;
  maxFilesPerOperation: number;
  operationsPerDay: number;
  maxPagesPerFile: number;
  retentionMs: number;
};

export const DEFAULT_ANONYMOUS_CONFIG: AnonymousConfig = {
  maxFileSizeBytes: DEFAULT_ANONYMOUS_MAX_FILE_SIZE_BYTES,
  maxFilesPerOperation: DEFAULT_ANONYMOUS_MAX_FILES_PER_OPERATION,
  operationsPerDay: DEFAULT_ANONYMOUS_OPERATIONS_PER_DAY,
  maxPagesPerFile: DEFAULT_ANONYMOUS_MAX_PAGES_PER_FILE,
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
    operationsPerDay: parsePositiveInteger(
      "ANONYMOUS_OPERATIONS_PER_DAY",
      getOptionalEnv("ANONYMOUS_OPERATIONS_PER_DAY", source) ??
        getOptionalEnv("ANONYMOUS_OPERATIONS_PER_HOUR", source),
      DEFAULT_ANONYMOUS_OPERATIONS_PER_DAY,
    ),
    maxPagesPerFile: parsePositiveInteger(
      "ANONYMOUS_MAX_PAGES_PER_FILE",
      getOptionalEnv("ANONYMOUS_MAX_PAGES_PER_FILE", source),
      DEFAULT_ANONYMOUS_MAX_PAGES_PER_FILE,
    ),
    retentionMs: retentionHours * 60 * 60 * 1000,
  };
}
