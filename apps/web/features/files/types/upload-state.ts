import type { FileErrorKey } from "@/features/files/api/file-errors";
import type { PresignedUpload, PublicFile } from "@/features/files/types/file";

export const UPLOAD_STATUSES = [
  "idle",
  "selecting",
  "preparing",
  "uploading",
  "finalizing",
  "completed",
  "failed",
  "cancelled",
] as const;

export type UploadStatus = (typeof UPLOAD_STATUSES)[number];

export type UploadFailureStage =
  | "validation"
  | "preparing"
  | "uploading"
  | "finalizing";

export type UploadRetryAction = "prepare" | "upload" | "finalize";

export type UploadProgress = {
  loaded: number;
  total: number;
  percent: number;
};

export type PreparedUpload = PresignedUpload & {
  expiresAtMs: number;
};

export type FileUploadState = {
  status: UploadStatus;
  selectedFile: File | null;
  contentType: string | null;
  publicFile: PublicFile | null;
  upload: PreparedUpload | null;
  progress: UploadProgress;
  errorKey: FileErrorKey | null;
  failureStage: UploadFailureStage | null;
};

export const INITIAL_UPLOAD_PROGRESS: UploadProgress = {
  loaded: 0,
  total: 0,
  percent: 0,
};

export function createInitialUploadState(): FileUploadState {
  return {
    status: "idle",
    selectedFile: null,
    contentType: null,
    publicFile: null,
    upload: null,
    progress: INITIAL_UPLOAD_PROGRESS,
    errorKey: null,
    failureStage: null,
  };
}

export type UploadAction =
  | { type: "picker-opened" }
  | { type: "reset" }
  | { type: "validation-failed"; errorKey: FileErrorKey }
  | { type: "file-accepted"; file: File; contentType: string }
  | { type: "preparing" }
  | {
      type: "prepared";
      publicFile: PublicFile;
      upload: PreparedUpload;
    }
  | { type: "uploading" }
  | { type: "progress"; progress: UploadProgress }
  | { type: "finalizing" }
  | { type: "completed"; publicFile: PublicFile }
  | { type: "failed"; stage: UploadFailureStage; errorKey: FileErrorKey }
  | { type: "cancelled"; stage: UploadFailureStage };
