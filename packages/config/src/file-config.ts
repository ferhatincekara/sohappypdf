import { type EnvSource, getOptionalEnv } from "./env.js";
import { parsePositiveInteger } from "./parse-positive-integer.js";

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
  maxUploadFileSizeBytes: 1024 * 1024 * 1024,
  retentionMs: DEFAULT_FILE_RETENTION_MS,
  cleanupBatchSize: DEFAULT_FILE_CLEANUP_BATCH_SIZE,
};

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
