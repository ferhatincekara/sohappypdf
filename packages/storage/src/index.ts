import { assertServerOnly } from "@repo/core";

assertServerOnly("@repo/storage");

export type { StorageConfig } from "./config.js";
export {
  assertValidObjectKey,
  createFileOriginalKey,
  createFileOutputKey,
  createObjectKey,
} from "./object-key.js";
export type {
  GetObjectResult,
  ObjectMetadata,
  PresignDownloadInput,
  PresignedUrlResult,
  PresignUploadInput,
  Storage,
  UploadObjectInput,
  UploadObjectResult,
} from "./storage.js";
export {
  createStorage,
  DEFAULT_PRESIGN_EXPIRES_IN_SECONDS,
  getStorage,
} from "./storage.js";
