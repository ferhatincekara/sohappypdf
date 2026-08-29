import {
  type EnvSource,
  loadStorageConfig,
  type StorageConfig,
} from "@sohappypdf/config";
import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";

export type { StorageConfig };

const BUCKET_NAME_PATTERN = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/;

export function getStorageConfig(source?: EnvSource): StorageConfig {
  const config = loadStorageConfig(source);

  if (!BUCKET_NAME_PATTERN.test(config.bucket)) {
    throw new AppError({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message: "Invalid S3_BUCKET_NAME",
    });
  }

  return config;
}
