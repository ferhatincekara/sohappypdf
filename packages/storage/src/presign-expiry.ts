import { APP_ERROR_CODES, AppError } from "@repo/core";

export const DEFAULT_PRESIGN_EXPIRES_IN_SECONDS = 15 * 60;
export const MAX_PRESIGN_EXPIRES_IN_SECONDS = 60 * 60;

export function resolvePresignExpiresInSeconds(
  expiresInSeconds: number | undefined,
): number {
  const value = expiresInSeconds ?? DEFAULT_PRESIGN_EXPIRES_IN_SECONDS;

  if (
    !Number.isInteger(value) ||
    value < 1 ||
    value > MAX_PRESIGN_EXPIRES_IN_SECONDS
  ) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid presigned URL expiration",
    });
  }

  return value;
}
