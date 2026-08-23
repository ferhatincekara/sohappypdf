import { assertServerOnly } from "@repo/core";

assertServerOnly("@repo/files");

export {
  DEFAULT_FILE_TTL_MS,
  isEligibleForCleanup,
  isFileExpired,
} from "./file-expiration.js";
export {
  DEFAULT_FILE_LIST_LIMIT,
  decodeFileListCursor,
  encodeFileListCursor,
  MAX_FILE_LIST_LIMIT,
} from "./file-pagination.js";
export type { FileRepository } from "./file-repository.js";
export { createFileRepository } from "./file-repository.js";
export type { FileService, FileServiceOptions } from "./file-service.js";
export { createFileService } from "./file-service.js";
export { getFileService } from "./file-service-factory.js";
export type { FileStatus } from "./file-status.js";
export {
  assertFileStatusTransition,
  canTransitionFileStatus,
  FILE_STATUSES,
  isFileStatus,
} from "./file-status.js";
export type {
  CreateFileInput,
  CreateFileResult,
  FileListQuery,
  FileListResult,
  FileRecord,
  RegisterStoredFileInput,
} from "./file-types.js";
export { MAX_FILE_SIZE_BYTES } from "./file-validation.js";
