import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";

export function assertObjectByteLimit(
  sizeBytes: number,
  maxBytes: number,
): void {
  if (!Number.isInteger(maxBytes) || maxBytes < 1) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid object size limit",
    });
  }

  if (sizeBytes > maxBytes) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Object exceeds size limit",
    });
  }
}
