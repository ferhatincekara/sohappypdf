import { APP_ERROR_CODES, AppError } from "@repo/core";
import { type EnvSource, getOptionalEnv } from "./env.js";

export type FileConfig = {
  maxUploadFileSizeBytes: number;
};

export const DEFAULT_FILE_CONFIG = {
  maxUploadFileSizeBytes: 100 * 1024 * 1024,
} as const;

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

export function loadFileConfig(source: EnvSource = process.env): FileConfig {
  return {
    maxUploadFileSizeBytes: parsePositiveInteger(
      "MAX_UPLOAD_FILE_SIZE",
      getOptionalEnv("MAX_UPLOAD_FILE_SIZE", source),
      DEFAULT_FILE_CONFIG.maxUploadFileSizeBytes,
    ),
  };
}
