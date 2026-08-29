import { FILE_ERROR_KEYS } from "@/features/files/api/file-errors";
import {
  createInitialUploadState,
  type FileUploadState,
  INITIAL_UPLOAD_PROGRESS,
  type PreparedUpload,
  type UploadAction,
  type UploadFailureStage,
  type UploadRetryAction,
  type UploadStatus,
} from "@/features/files/types/upload-state";

const ACTIVE_UPLOAD_STATUSES: readonly UploadStatus[] = [
  "preparing",
  "uploading",
  "finalizing",
];

const PRESIGNED_URL_EXPIRY_BUFFER_MS = 5_000;

export function reduceUploadState(
  state: FileUploadState,
  action: UploadAction,
): FileUploadState {
  switch (action.type) {
    case "picker-opened":
      return {
        ...state,
        status: "selecting",
        errorKey: null,
      };
    case "reset":
      return createInitialUploadState();
    case "validation-failed":
      return {
        ...createInitialUploadState(),
        status: "failed",
        errorKey: action.errorKey,
        failureStage: "validation",
      };
    case "file-accepted":
      return {
        ...createInitialUploadState(),
        status: "preparing",
        selectedFile: action.file,
        contentType: action.contentType,
      };
    case "preparing":
      return {
        ...state,
        status: "preparing",
        publicFile: null,
        upload: null,
        progress: INITIAL_UPLOAD_PROGRESS,
        errorKey: null,
        failureStage: null,
      };
    case "prepared":
      return {
        ...state,
        status: "uploading",
        publicFile: action.publicFile,
        upload: action.upload,
        errorKey: null,
        failureStage: null,
      };
    case "uploading":
      return {
        ...state,
        status: "uploading",
        progress: INITIAL_UPLOAD_PROGRESS,
        errorKey: null,
        failureStage: null,
      };
    case "progress":
      return {
        ...state,
        progress: action.progress,
      };
    case "finalizing":
      return {
        ...state,
        status: "finalizing",
        progress: {
          loaded: state.progress.total || state.selectedFile?.size || 0,
          total: state.progress.total || state.selectedFile?.size || 0,
          percent: 100,
        },
        errorKey: null,
        failureStage: null,
      };
    case "completed":
      return {
        ...state,
        status: "completed",
        publicFile: action.publicFile,
        upload: null,
        errorKey: null,
        failureStage: null,
      };
    case "failed":
      return {
        ...state,
        status: "failed",
        errorKey: action.errorKey,
        failureStage: action.stage,
      };
    case "cancelled":
      return {
        ...state,
        status: "cancelled",
        errorKey: null,
        failureStage: action.stage,
      };
  }
}

export function isUploadInFlight(status: UploadStatus): boolean {
  return ACTIVE_UPLOAD_STATUSES.includes(status);
}

export function stageFromStatus(status: UploadStatus): UploadFailureStage {
  if (status === "uploading") {
    return "uploading";
  }

  if (status === "finalizing") {
    return "finalizing";
  }

  return "preparing";
}

export function isPresignedUploadExpired(
  upload: PreparedUpload | null,
  now = Date.now(),
): boolean {
  if (upload === null) {
    return true;
  }

  return now >= upload.expiresAtMs - PRESIGNED_URL_EXPIRY_BUFFER_MS;
}

export function resolveRetryAction(
  state: FileUploadState,
  now = Date.now(),
): UploadRetryAction | null {
  if (state.selectedFile === null || state.contentType === null) {
    return null;
  }

  if (state.status !== "failed" && state.status !== "cancelled") {
    return null;
  }

  if (state.failureStage === "validation") {
    return null;
  }

  if (state.failureStage === "preparing") {
    return "prepare";
  }

  if (state.failureStage === "uploading") {
    return isPresignedUploadExpired(state.upload, now) ? "prepare" : "upload";
  }

  if (state.failureStage === "finalizing") {
    if (
      state.errorKey === FILE_ERROR_KEYS.objectNotUploaded ||
      state.errorKey === FILE_ERROR_KEYS.expiredUpload
    ) {
      return isPresignedUploadExpired(state.upload, now) ? "prepare" : "upload";
    }

    if (
      state.errorKey === FILE_ERROR_KEYS.fileNotFound ||
      state.publicFile === null
    ) {
      return "prepare";
    }

    return "finalize";
  }

  return "prepare";
}

export function toPreparedUpload(
  upload: {
    url: string;
    method: "PUT";
    headers: { "Content-Type": string };
    expiresInSeconds: number;
  },
  now = Date.now(),
): PreparedUpload {
  return {
    ...upload,
    expiresAtMs: now + upload.expiresInSeconds * 1000,
  };
}
