import {
  CONVERSION_ERROR_KEYS,
  mapUnknownConversionError,
  toConversionClientError,
} from "@/features/conversions/api/conversion-errors";
import type { PublicConversionError } from "@/features/conversions/types/conversion";
import {
  FILE_ERROR_KEYS,
  mapUnknownUploadError,
  toFileClientError,
} from "@/features/files/api/file-errors";

export const PUBLIC_TOOL_ERROR_KEYS = [
  "noFile",
  "tooFewFiles",
  "tooManyFiles",
  "tooLarge",
  "unsupported",
  "invalidOptions",
  "rateLimited",
  "networkFailure",
  "creditsExhausted",
  "limitReached",
  "signInRequired",
  "passwordProtected",
  "processingFailed",
  "unexpected",
] as const;

export type PublicToolErrorKey = (typeof PUBLIC_TOOL_ERROR_KEYS)[number];

function mapUploadErrorKey(errorKey: string): PublicToolErrorKey | undefined {
  switch (errorKey) {
    case FILE_ERROR_KEYS.fileTooLarge:
      return "tooLarge";
    case FILE_ERROR_KEYS.unsupportedType:
    case FILE_ERROR_KEYS.emptyFile:
      return "unsupported";
    case FILE_ERROR_KEYS.rateLimited:
      return "rateLimited";
    case FILE_ERROR_KEYS.unauthorized:
      return "signInRequired";
    case FILE_ERROR_KEYS.storageLimitReached:
      return "limitReached";
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
      return "invalidOptions";
    case CONVERSION_ERROR_KEYS.planLimitReached:
      return "limitReached";
    case CONVERSION_ERROR_KEYS.unauthorized:
      return "signInRequired";
    case CONVERSION_ERROR_KEYS.sourceUnavailable:
    case CONVERSION_ERROR_KEYS.conflict:
      return "networkFailure";
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

  const haystack = `${error.code} ${error.message}`.toLowerCase();

  if (
    haystack.includes("password") ||
    haystack.includes("encrypted") ||
    haystack.includes("locked")
  ) {
    return "passwordProtected";
  }

  if (haystack.includes("credit")) {
    return "creditsExhausted";
  }

  if (haystack.includes("limit")) {
    return "limitReached";
  }

  return "processingFailed";
}

export function mapPublicToolError(error: unknown): PublicToolErrorKey {
  const fileClient = toFileClientError(error);
  if (fileClient.code === "INTERNAL_ERROR") {
    return "networkFailure";
  }
  if (fileClient.code === "FORBIDDEN") {
    return "signInRequired";
  }
  if (fileClient.code === "PLAN_LIMIT_REACHED") {
    const message = fileClient.message?.toLowerCase() ?? "";
    return message.includes("credit") ? "creditsExhausted" : "limitReached";
  }

  const conversionClient = toConversionClientError(error);
  if (conversionClient.code === "INTERNAL_ERROR") {
    return "networkFailure";
  }
  if (conversionClient.code === "FORBIDDEN") {
    return "signInRequired";
  }
  if (conversionClient.code === "PLAN_LIMIT_REACHED") {
    const message = conversionClient.message?.toLowerCase() ?? "";
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

  if (toFileClientError(error).kind === "network") {
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
