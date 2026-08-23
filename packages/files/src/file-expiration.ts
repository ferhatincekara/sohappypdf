import { APP_ERROR_CODES, AppError } from "@repo/core";
import type { FileRecord } from "./file-types.js";

export const DEFAULT_FILE_RETENTION_MS = 2 * 60 * 60 * 1000;
export const DEFAULT_FILE_TTL_MS = DEFAULT_FILE_RETENTION_MS;

export function getFileExpirationDate(input: {
  createdAt: Date;
  retentionMs?: number;
}): Date {
  const retentionMs = input.retentionMs ?? DEFAULT_FILE_RETENTION_MS;

  if (!Number.isInteger(retentionMs) || retentionMs < 1) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid file expiration",
    });
  }

  return new Date(input.createdAt.getTime() + retentionMs);
}

export function isFileExpired(
  file: FileRecord,
  now: Date = new Date(),
): boolean {
  return file.expiresAt.getTime() <= now.getTime();
}

export function isEligibleForCleanup(
  file: FileRecord,
  now: Date = new Date(),
): boolean {
  if (file.status === "deleted" || file.deletedAt !== null) {
    return true;
  }

  return isFileExpired(file, now);
}
