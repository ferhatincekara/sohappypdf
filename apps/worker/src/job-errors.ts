import type { ConversionFailureCode } from "@repo/conversions";
import { APP_ERROR_CODES, isAppError } from "@repo/core";

export class PermanentConversionError extends Error {
  override readonly name = "PermanentConversionError";
  readonly failureCode: ConversionFailureCode;

  constructor(failureCode: ConversionFailureCode, message: string) {
    super(message);
    this.failureCode = failureCode;
  }
}

export function isPermanentConversionError(
  error: unknown,
): error is PermanentConversionError {
  return error instanceof PermanentConversionError;
}

export function isRetryableConversionError(error: unknown): boolean {
  if (isPermanentConversionError(error)) {
    return false;
  }

  if (isAppError(error)) {
    return (
      error.code === APP_ERROR_CODES.INTERNAL_ERROR ||
      error.code === APP_ERROR_CODES.CONFIGURATION_ERROR
    );
  }

  return true;
}

export function toSafeFailure(error: unknown): {
  errorCode: ConversionFailureCode;
  errorMessage: string;
} {
  if (isPermanentConversionError(error)) {
    return {
      errorCode: error.failureCode,
      errorMessage: error.message,
    };
  }

  if (isAppError(error) && error.code === APP_ERROR_CODES.VALIDATION_ERROR) {
    return {
      errorCode: "invalid_options",
      errorMessage: error.message,
    };
  }

  if (isAppError(error) && error.code === APP_ERROR_CODES.NOT_FOUND) {
    return {
      errorCode: "source_file_unavailable",
      errorMessage: "Source file unavailable",
    };
  }

  return {
    errorCode: "processing_failed",
    errorMessage: "Conversion failed",
  };
}
