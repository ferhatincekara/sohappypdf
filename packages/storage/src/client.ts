import { S3Client } from "@aws-sdk/client-s3";
import type { StorageConfig } from "./config.js";

export function createS3Client(config: StorageConfig): S3Client {
  return new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}
