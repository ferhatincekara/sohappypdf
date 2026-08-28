import { FREE_MAX_PAGES_PER_FILE } from "@repo/billing/plans";
import { ConversionApiRequestError } from "@/features/conversions/api/conversion-api";
import {
  CONVERSION_ERROR_KEYS,
  mapUnknownConversionError,
  toConversionClientError,
} from "@/features/conversions/api/conversion-errors";
import type { PublicConversionError } from "@/features/conversions/types/conversion";
import { FileApiRequestError } from "@/features/files/api/file-api";
import {
  FILE_ERROR_KEYS,
  mapUnknownUploadError,
  toFileClientError,
} from "@/features/files/api/file-errors";

export const PUBLIC_TOOL_ERROR_KEYS = [
  "noFile",
  "tooFewFiles",
  "tooManyFiles",
  "tooManyPages",
  "tooLarge",
  "emptyFile",
  "unsupported",
  "invalidPdf",
  "corruptedFile",
  "invalidOptions",
  "rateLimited",
  "networkFailure",
  "uploadInterrupted",
  "creditsExhausted",
  "limitReached",
  "upgradeRequired",
  "signInRequired",
  "unauthorized",
  "passwordProtected",
  "processingFailed",
  "aiUnavailable",
  "duplicateExecution",
  "filesExpired",
  "unexpected",
] as const;

export type PublicToolErrorKey = (typeof PUBLIC_TOOL_ERROR_KEYS)[number];

export type ToolUserError = {
  key: PublicToolErrorKey;
  retryable: boolean;
};

const RETRYABLE_TOOL_ERROR_KEYS: ReadonlySet<PublicToolErrorKey> = new Set([
  "rateLimited",
  "networkFailure",
  "uploadInterrupted",
  "processingFailed",
  "unexpected",
]);

const EXPIRATION_ERROR_CODES = new Set(["FILE_EXPIRED", "GONE"]);

export function isRetryableToolError(key: PublicToolErrorKey): boolean {
  return RETRYABLE_TOOL_ERROR_KEYS.has(key);
}

export function toToolUserError(key: PublicToolErrorKey): ToolUserError {
  return {
    key,
    retryable: isRetryableToolError(key),
  };
}

export function publicToolErrorMessageValues(
  key: PublicToolErrorKey,
  maxPagesPerFile?: number | null,
): { max: number } | Record<string, never> {
  if (key !== "tooManyPages") {
    return {};
  }

  return {
    max: maxPagesPerFile ?? FREE_MAX_PAGES_PER_FILE,
  };
}

export function isPlanUpgradeToolError(key: PublicToolErrorKey): boolean {
  return key === "tooManyPages" || key === "upgradeRequired";
}

export function canRetryWorkspaceFileError(
  key: PublicToolErrorKey | null,
): boolean {
  return key !== "tooManyPages";
}

function readClientStatusAndCode(error: unknown): {
  status?: number;
  code?: string;
} {
  if (error instanceof FileApiRequestError) {
    return {
      status: error.clientError.status,
      code: error.clientError.code,
    };
  }

  if (error instanceof ConversionApiRequestError) {
    return {
      status: error.clientError.status,
      code: error.clientError.code,
    };
  }

  const fileClient = toFileClientError(error);
  if (fileClient.status !== undefined || fileClient.code !== undefined) {
    return { status: fileClient.status, code: fileClient.code };
  }

  const conversionClient = toConversionClientError(error);
  return { status: conversionClient.status, code: conversionClient.code };
}

export function isExpirationResponse(error: unknown): boolean {
  const client = readClientStatusAndCode(error);
  return (
    client.status === 410 ||
    (client.code !== undefined && EXPIRATION_ERROR_CODES.has(client.code))
  );
}

export function isMissingResourceResponse(error: unknown): boolean {
  const client = readClientStatusAndCode(error);
  return client.status === 404 || client.code === "NOT_FOUND";
}

function mapUploadErrorKey(errorKey: string): PublicToolErrorKey | undefined {
  switch (errorKey) {
    case FILE_ERROR_KEYS.fileTooLarge:
      return "tooLarge";
    case FILE_ERROR_KEYS.emptyFile:
      return "emptyFile";
    case FILE_ERROR_KEYS.unsupportedType:
    case FILE_ERROR_KEYS.invalidFilename:
      return "unsupported";
    case FILE_ERROR_KEYS.rateLimited:
      return "rateLimited";
    case FILE_ERROR_KEYS.unauthorized:
      return "signInRequired";
    case FILE_ERROR_KEYS.storageLimitReached:
      return "limitReached";
    case FILE_ERROR_KEYS.fileNotFound:
      return "filesExpired";
    case FILE_ERROR_KEYS.cancelled:
      return "uploadInterrupted";
    case FILE_ERROR_KEYS.networkFailure:
    case FILE_ERROR_KEYS.expiredUpload:
    case FILE_ERROR_KEYS.objectNotUploaded:
      return "networkFailure";
    default:
      return undefined;
  }
}

function mapConversionErrorKey(
  errorKey: string,
): PublicToolErrorKey | undefined {
  switch (errorKey) {
    case CONVERSION_ERROR_KEYS.rateLimited:
      return "rateLimited";
    case CONVERSION_ERROR_KEYS.networkFailure:
      return "networkFailure";
    case CONVERSION_ERROR_KEYS.unsupportedConversion:
    case CONVERSION_ERROR_KEYS.invalidTargetFormat:
    case CONVERSION_ERROR_KEYS.typeRequired:
      return "unsupported";
    case CONVERSION_ERROR_KEYS.invalidFile:
      return "invalidPdf";
    case CONVERSION_ERROR_KEYS.planLimitReached:
      return "limitReached";
    case CONVERSION_ERROR_KEYS.upgradeRequired:
      return "upgradeRequired";
    case CONVERSION_ERROR_KEYS.unauthorized:
      return "signInRequired";
    case CONVERSION_ERROR_KEYS.sourceUnavailable:
    case CONVERSION_ERROR_KEYS.notFound:
      return "filesExpired";
    case CONVERSION_ERROR_KEYS.conflict:
      return "duplicateExecution";
    default:
      return undefined;
  }
}

export function mapConversionFailure(
  error: PublicConversionError | undefined,
): PublicToolErrorKey {
  if (error === undefined) {
    return "processingFailed";
  }

  if (error.code === "invalid_source_format") {
    return "invalidPdf";
  }

  if (error.code === "unsupported_conversion") {
    return "unsupported";
  }

  if (
    error.code === "invalid_options" ||
    error.code === "invalid_target_format"
  ) {
    return "invalidOptions";
  }

  if (error.code === "source_file_unavailable") {
    return "filesExpired";
  }

  const haystack = `${error.code} ${error.message}`.toLowerCase();

  if (
    haystack.includes("password") ||
    haystack.includes("encrypted") ||
    haystack.includes("locked")
  ) {
    return "passwordProtected";
  }

  if (
    haystack.includes("corrupt") ||
    haystack.includes("damaged") ||
    haystack.includes("malformed") ||
    haystack.includes("invalid pdf")
  ) {
    return "corruptedFile";
  }

  if (haystack.includes("credit")) {
    return "creditsExhausted";
  }

  if (haystack.includes("page") && haystack.includes("limit")) {
    return "tooManyPages";
  }

  if (haystack.includes("limit")) {
    return "limitReached";
  }

  if (
    haystack.includes("ai processing") ||
    haystack.includes("ai provider") ||
    haystack.includes("not configured")
  ) {
    return "aiUnavailable";
  }

  return "processingFailed";
}

export function mapPublicToolError(error: unknown): PublicToolErrorKey {
  if (isExpirationResponse(error)) {
    return "filesExpired";
  }

  if (error instanceof ConversionApiRequestError) {
    if (error.clientError.code === "INTERNAL_ERROR") {
      return "unexpected";
    }
    if (error.clientError.code === "CONFIGURATION_ERROR") {
      const message = error.clientError.message?.toLowerCase() ?? "";
      return message.includes("ai") ? "aiUnavailable" : "unexpected";
    }
    if (error.clientError.code === "FORBIDDEN") {
      return "unauthorized";
    }
    if (error.clientError.code === "PLAN_LIMIT_REACHED") {
      const message = error.clientError.message?.toLowerCase() ?? "";
      if (message.includes("requires pro")) {
        return "upgradeRequired";
      }
      return message.includes("credit") ? "creditsExhausted" : "limitReached";
    }

    const conversionError = mapConversionErrorKey(
      mapUnknownConversionError(error),
    );
    if (conversionError !== undefined) {
      return conversionError;
    }

    if (error.clientError.kind === "network") {
      return "networkFailure";
    }

    return "unexpected";
  }

  const fileClient =
    error instanceof FileApiRequestError
      ? error.clientError
      : toFileClientError(error);
  if (
    fileClient.code === "INTERNAL_ERROR" ||
    fileClient.code === "CONFIGURATION_ERROR"
  ) {
    return "unexpected";
  }
  if (fileClient.code === "FORBIDDEN") {
    return "unauthorized";
  }
  if (fileClient.code === "PLAN_LIMIT_REACHED") {
    const message = fileClient.message?.toLowerCase() ?? "";
    if (message.includes("requires pro")) {
      return "upgradeRequired";
    }
    return message.includes("credit") ? "creditsExhausted" : "limitReached";
  }

  if (error instanceof Error) {
    const uploadFromMessage = mapUploadErrorKey(error.message);
    if (uploadFromMessage !== undefined) {
      return uploadFromMessage;
    }
  }

  const uploadError = mapUploadErrorKey(mapUnknownUploadError(error));
  if (uploadError !== undefined) {
    return uploadError;
  }

  const conversionError = mapConversionErrorKey(
    mapUnknownConversionError(error),
  );
  if (conversionError !== undefined) {
    return conversionError;
  }

  if (fileClient.kind === "network") {
    return "networkFailure";
  }

  return "unexpected";
}

export function mapUploadWorkflowErrorKey(
  errorKey: string | null,
): PublicToolErrorKey {
  if (errorKey === null) {
    return "unexpected";
  }

  return mapUploadErrorKey(errorKey) ?? "unexpected";
}
