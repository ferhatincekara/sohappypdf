import { assertServerOnly } from "@sohappypdf/core";

assertServerOnly("@sohappypdf/storage");

export {
  BROWSER_UPLOAD_CORS_RULE_ID,
  mergeBrowserUploadCorsRules,
} from "./bucket-cors.js";
export type { StorageConfig } from "./config.js";
export { getStorageConfig } from "./config.js";
export {
  assertValidObjectKey,
  createFileOriginalKey,
  createFileOutputKey,
  createObjectKey,
} from "./object-key.js";
export {
  MAX_PRESIGN_EXPIRES_IN_SECONDS,
  resolvePresignExpiresInSeconds,
} from "./presign-expiry.js";
export type {
  DownloadObjectToFileInput,
  DownloadObjectToFileResult,
  GetObjectResult,
  ObjectMetadata,
  PresignDownloadInput,
  PresignedUrlResult,
  PresignUploadInput,
  Storage,
  UploadObjectFromFileInput,
  UploadObjectInput,
  UploadObjectResult,
} from "./storage.js";
export {
  createStorage,
  DEFAULT_PRESIGN_EXPIRES_IN_SECONDS,
  getStorage,
} from "./storage.js";
