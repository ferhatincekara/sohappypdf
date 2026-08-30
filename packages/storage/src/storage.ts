import { createReadStream } from "node:fs";
import { open, stat, unlink } from "node:fs/promises";
import {
  type CORSRule,
  DeleteObjectCommand,
  GetBucketCorsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutBucketCorsCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { APP_ERROR_CODES, AppError, isAppError } from "@sohappypdf/core";
import { mergeBrowserUploadCorsRules } from "./bucket-cors.js";
import { createS3Client } from "./client.js";
import { getStorageConfig, type StorageConfig } from "./config.js";
import { toAttachmentContentDisposition } from "./content-disposition.js";
import { assertObjectByteLimit } from "./object-byte-limit.js";
import { assertValidObjectKey } from "./object-key.js";
import { resolvePresignExpiresInSeconds } from "./presign-expiry.js";

export { DEFAULT_PRESIGN_EXPIRES_IN_SECONDS } from "./presign-expiry.js";

const MAX_CONTENT_TYPE_LENGTH = 200;
const HEALTH_OBJECT_KEY = "files/health/ping";

export type UploadObjectInput = {
  key: string;
  body: Uint8Array;
  contentType?: string;
};

export type UploadObjectResult = {
  key: string;
};

export type PresignUploadInput = {
  key: string;
  contentType?: string;
  expiresInSeconds?: number;
};

export type PresignDownloadInput = {
  key: string;
  filename?: string;
  expiresInSeconds?: number;
};

export type PresignedUrlResult = {
  key: string;
  expiresInSeconds: number;
  url: string;
};

export type ObjectMetadata = {
  key: string;
  contentLength: number;
  contentType?: string;
};

export type GetObjectResult = {
  key: string;
  body: Uint8Array;
  contentType?: string;
};

export type DownloadObjectToFileInput = {
  key: string;
  destination: string;
  maxBytes: number;
};

export type DownloadObjectToFileResult = {
  key: string;
  sizeBytes: number;
  contentType?: string;
};

export type UploadObjectFromFileInput = {
  key: string;
  filePath: string;
  contentType?: string;
};

export type Storage = {
  uploadObject(input: UploadObjectInput): Promise<UploadObjectResult>;
  uploadObjectFromFile(
    input: UploadObjectFromFileInput,
  ): Promise<UploadObjectResult>;
  getObject(key: string): Promise<GetObjectResult>;
  downloadObjectToFile(
    input: DownloadObjectToFileInput,
  ): Promise<DownloadObjectToFileResult>;
  getObjectMetadata(key: string): Promise<ObjectMetadata | undefined>;
  createPresignedUploadUrl(
    input: PresignUploadInput,
  ): Promise<PresignedUrlResult>;
  createPresignedDownloadUrl(
    input: PresignDownloadInput,
  ): Promise<PresignedUrlResult>;
  deleteObject(key: string): Promise<void>;
  objectExists(key: string): Promise<boolean>;
  ping(): Promise<void>;
  ensureBrowserUploadCors(origins: readonly string[]): Promise<void>;
};

function assertSafeContentType(contentType: string): void {
  if (
    contentType.length === 0 ||
    contentType.length > MAX_CONTENT_TYPE_LENGTH ||
    /[\r\n]/.test(contentType)
  ) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid content type",
    });
  }
}

function resolveExpiresInSeconds(expiresInSeconds: number | undefined): number {
  return resolvePresignExpiresInSeconds(expiresInSeconds);
}

function isMissingBucketCors(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  if (
    "name" in error &&
    (error.name === "NoSuchCORSConfiguration" || error.name === "NotFound")
  ) {
    return true;
  }

  if ("$metadata" in error) {
    const metadata = error.$metadata;

    if (
      typeof metadata === "object" &&
      metadata !== null &&
      "httpStatusCode" in metadata
    ) {
      return metadata.httpStatusCode === 404;
    }
  }

  return false;
}

function isS3NotFound(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  if ("name" in error && error.name === "NotFound") {
    return true;
  }

  if ("$metadata" in error) {
    const metadata = error.$metadata;

    if (
      typeof metadata === "object" &&
      metadata !== null &&
      "httpStatusCode" in metadata
    ) {
      return metadata.httpStatusCode === 404;
    }
  }

  return false;
}

function toStorageError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  return new AppError({
    code: APP_ERROR_CODES.INTERNAL_ERROR,
    message: "Storage operation failed",
    cause: error,
  });
}

export function createStorage(config: StorageConfig): Storage {
  const client = createS3Client(config);
  const bucket = config.bucket;

  return {
    async uploadObject(input) {
      const key = assertValidObjectKey(input.key);

      if (input.contentType !== undefined) {
        assertSafeContentType(input.contentType);
      }

      try {
        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: input.body,
            ContentType: input.contentType,
          }),
        );
      } catch (error) {
        throw toStorageError(error);
      }

      return { key };
    },

    async uploadObjectFromFile(input) {
      const key = assertValidObjectKey(input.key);

      if (input.contentType !== undefined) {
        assertSafeContentType(input.contentType);
      }

      try {
        const fileStat = await stat(input.filePath);

        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: createReadStream(input.filePath),
            ContentType: input.contentType,
            ContentLength: fileStat.size,
          }),
        );
      } catch (error) {
        throw toStorageError(error);
      }

      return { key };
    },

    async getObject(key) {
      const objectKey = assertValidObjectKey(key);

      try {
        const response = await client.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: objectKey,
          }),
        );

        if (response.Body === undefined) {
          throw new AppError({
            code: APP_ERROR_CODES.NOT_FOUND,
            message: "Object not found",
          });
        }

        return {
          key: objectKey,
          body: await response.Body.transformToByteArray(),
          contentType: response.ContentType,
        };
      } catch (error) {
        if (isS3NotFound(error)) {
          throw new AppError({
            code: APP_ERROR_CODES.NOT_FOUND,
            message: "Object not found",
          });
        }

        throw toStorageError(error);
      }
    },

    async downloadObjectToFile(input) {
      const objectKey = assertValidObjectKey(input.key);

      try {
        const response = await client.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: objectKey,
          }),
        );

        if (response.Body === undefined) {
          throw new AppError({
            code: APP_ERROR_CODES.NOT_FOUND,
            message: "Object not found",
          });
        }

        const handle = await open(input.destination, "w");
        const reader = response.Body.transformToWebStream().getReader();
        let sizeBytes = 0;

        try {
          for (;;) {
            const { done, value } = await reader.read();

            if (done) {
              break;
            }

            if (value === undefined) {
              continue;
            }

            sizeBytes += value.byteLength;
            assertObjectByteLimit(sizeBytes, input.maxBytes);
            await handle.write(value);
          }
        } catch (error) {
          await reader.cancel().catch(() => undefined);
          await handle.close();
          await unlink(input.destination).catch(() => undefined);
          throw error;
        }

        await handle.close();

        return {
          key: objectKey,
          sizeBytes,
          contentType: response.ContentType,
        };
      } catch (error) {
        if (isS3NotFound(error)) {
          throw new AppError({
            code: APP_ERROR_CODES.NOT_FOUND,
            message: "Object not found",
          });
        }

        throw toStorageError(error);
      }
    },

    async getObjectMetadata(key) {
      const objectKey = assertValidObjectKey(key);

      try {
        const response = await client.send(
          new HeadObjectCommand({
            Bucket: bucket,
            Key: objectKey,
          }),
        );

        return {
          key: objectKey,
          contentLength: response.ContentLength ?? 0,
          contentType: response.ContentType,
        };
      } catch (error) {
        if (isS3NotFound(error)) {
          return undefined;
        }

        throw toStorageError(error);
      }
    },

    async createPresignedUploadUrl(input) {
      const key = assertValidObjectKey(input.key);
      const expiresInSeconds = resolveExpiresInSeconds(input.expiresInSeconds);

      if (input.contentType !== undefined) {
        assertSafeContentType(input.contentType);
      }

      try {
        const url = await getSignedUrl(
          client,
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            ContentType: input.contentType,
          }),
          { expiresIn: expiresInSeconds },
        );

        return { key, expiresInSeconds, url };
      } catch (error) {
        throw toStorageError(error);
      }
    },

    async createPresignedDownloadUrl(input) {
      const key = assertValidObjectKey(input.key);
      const expiresInSeconds = resolveExpiresInSeconds(input.expiresInSeconds);
      const responseContentDisposition =
        input.filename === undefined
          ? undefined
          : toAttachmentContentDisposition(input.filename);

      try {
        const url = await getSignedUrl(
          client,
          new GetObjectCommand({
            Bucket: bucket,
            Key: key,
            ResponseContentDisposition: responseContentDisposition,
          }),
          { expiresIn: expiresInSeconds },
        );

        return { key, expiresInSeconds, url };
      } catch (error) {
        throw toStorageError(error);
      }
    },

    async deleteObject(key) {
      const objectKey = assertValidObjectKey(key);

      try {
        await client.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: objectKey,
          }),
        );
      } catch (error) {
        if (isS3NotFound(error)) {
          return;
        }

        throw toStorageError(error);
      }
    },

    async objectExists(key) {
      const objectKey = assertValidObjectKey(key);

      try {
        await client.send(
          new HeadObjectCommand({
            Bucket: bucket,
            Key: objectKey,
          }),
        );
        return true;
      } catch (error) {
        if (isS3NotFound(error)) {
          return false;
        }

        throw toStorageError(error);
      }
    },

    async ping() {
      const key = assertValidObjectKey(HEALTH_OBJECT_KEY);

      try {
        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: new Uint8Array([1]),
            ContentType: "application/octet-stream",
          }),
        );
        await client.send(
          new HeadObjectCommand({
            Bucket: bucket,
            Key: key,
          }),
        );
      } catch (error) {
        await client
          .send(
            new DeleteObjectCommand({
              Bucket: bucket,
              Key: key,
            }),
          )
          .catch(() => undefined);
        throw toStorageError(error);
      }

      try {
        await client.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
          }),
        );
      } catch (error) {
        throw toStorageError(error);
      }
    },

    async ensureBrowserUploadCors(origins) {
      let existing: CORSRule[] | undefined;

      try {
        const response = await client.send(
          new GetBucketCorsCommand({
            Bucket: bucket,
          }),
        );
        existing = response.CORSRules;
      } catch (error) {
        if (!isMissingBucketCors(error)) {
          throw toStorageError(error);
        }
      }

      const rules = mergeBrowserUploadCorsRules(existing, origins);

      if (rules.length === 0) {
        return;
      }

      try {
        await client.send(
          new PutBucketCorsCommand({
            Bucket: bucket,
            CORSConfiguration: {
              CORSRules: rules,
            },
          }),
        );
      } catch (error) {
        throw toStorageError(error);
      }
    },
  };
}

let storage: Storage | undefined;

export function getStorage(): Storage {
  if (storage === undefined) {
    storage = createStorage(getStorageConfig());
  }

  return storage;
}
