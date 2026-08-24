import { S3Client } from "@aws-sdk/client-s3";
import type { StorageConfig } from "./config.js";

export function createS3Client(config: StorageConfig): S3Client {
  return new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    // Browser PUT uploads cannot send the flexible checksum headers that
    // AWS SDK v3 otherwise embeds in presigned URLs.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}
