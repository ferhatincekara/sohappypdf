import { assertServerOnly } from "@repo/core";

assertServerOnly("@repo/files");

export {
  DEFAULT_FILE_RETENTION_MS,
  DEFAULT_FILE_TTL_MS,
  getFileExpirationDate,
  isEligibleForCleanup,
  isFileExpired,
  remainingFileTtlMs,
} from "./file-expiration.js";
export {
  DEFAULT_FILE_LIST_LIMIT,
  decodeFileListCursor,
  encodeFileListCursor,
  MAX_FILE_LIST_LIMIT,
} from "./file-pagination.js";
export type { FileRepository } from "./file-repository.js";
export { createFileRepository } from "./file-repository.js";
export type {
  FileCleanupSummary,
  FileDownloadUrl,
  FileService,
  FileServiceOptions,
} from "./file-service.js";
export { createFileService } from "./file-service.js";
export { getFileService } from "./file-service-factory.js";
export type { FileStatus } from "./file-status.js";
export {
  assertFileStatusTransition,
  canTransitionFileStatus,
  FILE_STATUSES,
  isFileStatus,
} from "./file-status.js";
export {
  isActiveStorageFile,
  sumActiveStorageBytesForOwner,
} from "./file-storage-usage.js";
export type {
  CreateFileInput,
  CreateFileResult,
  FileListQuery,
  FileListResult,
  FileRecord,
  RegisterStoredFileInput,
} from "./file-types.js";
export { MAX_FILE_SIZE_BYTES } from "./file-validation.js";
export type { ResourceOwnerKind } from "./resource-owner.js";
export {
  DEFAULT_RESOURCE_OWNER_KIND,
  isResourceOwnerKind,
  RESOURCE_OWNER_KINDS,
} from "./resource-owner.js";
