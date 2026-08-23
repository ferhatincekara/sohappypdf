import { type EnvSource, getRequiredEnv } from "./env.js";

export type StorageConfig = {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
};

export function loadStorageConfig(
  source: EnvSource = process.env,
): StorageConfig {
  return {
    region: getRequiredEnv("AWS_REGION", source),
    accessKeyId: getRequiredEnv("AWS_ACCESS_KEY_ID", source),
    secretAccessKey: getRequiredEnv("AWS_SECRET_ACCESS_KEY", source),
    bucket: getRequiredEnv("S3_BUCKET_NAME", source),
  };
}
