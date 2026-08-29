import axios from "axios";

export const FILE_ERROR_KEYS = {
  missingFile: "missingFile",
  multipleFiles: "multipleFiles",
  invalidFilename: "invalidFilename",
  unsupportedType: "unsupportedType",
  emptyFile: "emptyFile",
  fileTooLarge: "fileTooLarge",
  storageLimitReached: "storageLimitReached",
  expiredUpload: "expiredUpload",
  objectNotUploaded: "objectNotUploaded",
  fileNotFound: "fileNotFound",
  unauthorized: "unauthorized",
  rateLimited: "rateLimited",
  networkFailure: "networkFailure",
  cancelled: "cancelled",
  unexpected: "unexpected",
} as const;

export type FileErrorKey =
  (typeof FILE_ERROR_KEYS)[keyof typeof FILE_ERROR_KEYS];

export type FileClientError = {
  code?: string;
  message?: string;
  status?: number;
  kind?: "api" | "storage" | "network" | "cancelled" | "validation";
};

const SAFE_VALIDATION_MESSAGES: Record<string, FileErrorKey> = {
  "Unsupported content type": FILE_ERROR_KEYS.unsupportedType,
  "Invalid file size": FILE_ERROR_KEYS.fileTooLarge,
  "Invalid original filename": FILE_ERROR_KEYS.invalidFilename,
};

export function isCancelError(error: unknown): boolean {
  return (
    axios.isCancel(error) ||
    (error instanceof Error && error.name === "CanceledError") ||
    (error instanceof StorageUploadError && error.kind === "cancelled")
  );
}

export class StorageUploadError extends Error {
  readonly kind: "expired" | "network" | "failed" | "cancelled";
  readonly status?: number;

  constructor(
    kind: "expired" | "network" | "failed" | "cancelled",
    status?: number,
  ) {
    super("Storage upload failed");
    this.name = "StorageUploadError";
    this.kind = kind;
    this.status = status;
  }
}

export function mapUnknownUploadError(error: unknown): FileErrorKey {
  if (error instanceof StorageUploadError) {
    if (error.kind === "cancelled") {
      return FILE_ERROR_KEYS.cancelled;
    }

    if (error.kind === "network") {
      return FILE_ERROR_KEYS.networkFailure;
    }

    if (error.kind === "expired") {
      return FILE_ERROR_KEYS.expiredUpload;
    }

    return FILE_ERROR_KEYS.unexpected;
  }

  if (
    error instanceof Error &&
    error.name === "FileApiRequestError" &&
    "clientError" in error
  ) {
    return mapFileError(error.clientError as FileClientError);
  }

  return mapFileError(toFileClientError(error));
}

export function toFileClientError(error: unknown): FileClientError {
  if (isCancelError(error)) {
    return { kind: "cancelled", status: 0 };
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;
    const apiError = readApiErrorBody(data);

    if (apiError !== undefined) {
      return {
        kind: "api",
        code: apiError.code,
        status,
        message:
          apiError.message !== undefined &&
          apiError.message in SAFE_VALIDATION_MESSAGES
            ? apiError.message
            : undefined,
      };
    }

    if (status === undefined || error.code === "ERR_NETWORK") {
      return { kind: "network", status: 0 };
    }

    if (
      isPresignedUrlRequest(error.config?.url) ||
      error.config?.method === "put"
    ) {
      return {
        kind: "storage",
        status,
      };
    }

    return { kind: "api", status };
  }

  if (error instanceof Error && /network/i.test(error.message)) {
    return { kind: "network", status: 0 };
  }

  return { kind: "api" };
}

export function mapFileError(error: FileClientError | null): FileErrorKey {
  if (error === null) {
    return FILE_ERROR_KEYS.unexpected;
  }

  if (error.kind === "cancelled") {
    return FILE_ERROR_KEYS.cancelled;
  }

  if (error.kind === "network" || error.status === 0) {
    return FILE_ERROR_KEYS.networkFailure;
  }

  if (error.kind === "storage") {
    if (error.status === 400 || error.status === 403) {
      return FILE_ERROR_KEYS.expiredUpload;
    }

    return FILE_ERROR_KEYS.unexpected;
  }

  if (error.code === "VALIDATION_ERROR") {
    if (
      error.message !== undefined &&
      error.message in SAFE_VALIDATION_MESSAGES
    ) {
      return (
        SAFE_VALIDATION_MESSAGES[error.message] ?? FILE_ERROR_KEYS.unexpected
      );
    }

    return FILE_ERROR_KEYS.unexpected;
  }

  if (error.code === "CONFLICT" || error.status === 409) {
    return FILE_ERROR_KEYS.objectNotUploaded;
  }

  if (error.code === "FILE_EXPIRED" || error.status === 410) {
    return FILE_ERROR_KEYS.expiredUpload;
  }

  if (error.code === "NOT_FOUND" || error.status === 404) {
    return FILE_ERROR_KEYS.fileNotFound;
  }

  if (error.code === "UNAUTHORIZED" || error.status === 401) {
    return FILE_ERROR_KEYS.unauthorized;
  }

  if (error.code === "RATE_LIMITED" || error.status === 429) {
    return FILE_ERROR_KEYS.rateLimited;
  }

  if (error.code === "FILE_TOO_LARGE" || error.status === 413) {
    return FILE_ERROR_KEYS.fileTooLarge;
  }

  if (error.code === "STORAGE_LIMIT_REACHED") {
    return FILE_ERROR_KEYS.storageLimitReached;
  }

  return FILE_ERROR_KEYS.unexpected;
}

function readApiErrorBody(
  data: unknown,
): { code: string; message?: string } | undefined {
  if (typeof data !== "object" || data === null || !("error" in data)) {
    return undefined;
  }

  const body = data.error;

  if (typeof body !== "object" || body === null || !("code" in body)) {
    return undefined;
  }

  if (typeof body.code !== "string") {
    return undefined;
  }

  const message =
    "message" in body && typeof body.message === "string"
      ? body.message
      : undefined;

  return { code: body.code, message };
}

function isPresignedUrlRequest(url: string | undefined): boolean {
  if (url === undefined) {
    return false;
  }

  return !url.includes("/v1/");
}
