import { APP_ERROR_CODES, AppError } from "@repo/core";
import type { FileRecord } from "./file-types.js";

export const DEFAULT_FILE_RETENTION_MS = 2 * 60 * 60 * 1000;
export const DEFAULT_FILE_TTL_MS = DEFAULT_FILE_RETENTION_MS;
export const FILE_EXPIRED_MESSAGE =
  "This file has expired. Please process it again.";

export const TEMPORARY_FILE_LIFECYCLE_STATES = [
  "ACTIVE",
  "PROCESSING",
  "READY",
  "EXPIRED",
  "FAILED",
] as const;

export type TemporaryFileLifecycleState =
  (typeof TEMPORARY_FILE_LIFECYCLE_STATES)[number];

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

export function remainingFileTtlMs(
  file: FileRecord,
  now: Date = new Date(),
): number {
  return Math.max(1, file.expiresAt.getTime() - now.getTime());
}

export function isEligibleForCleanup(
  file: FileRecord,
  now: Date = new Date(),
): boolean {
  if (file.purgedAt !== null) {
    return false;
  }

  if (file.status === "deleted" || file.deletedAt !== null) {
    return true;
  }

  return isFileExpired(file, now);
}

export function resolveTemporaryFileLifecycleState(
  file: FileRecord,
  now: Date = new Date(),
): TemporaryFileLifecycleState {
  if (isFileExpired(file, now)) {
    return "EXPIRED";
  }

  if (file.status === "processing") {
    return "PROCESSING";
  }

  if (file.status === "completed") {
    return "READY";
  }

  if (file.status === "failed") {
    return "FAILED";
  }

  return "ACTIVE";
}

export function throwIfOwnedFileExpired(
  file: FileRecord,
  now: Date = new Date(),
): void {
  if (!isFileExpired(file, now)) {
    return;
  }

  throw new AppError({
    code: APP_ERROR_CODES.FILE_EXPIRED,
    message: FILE_EXPIRED_MESSAGE,
  });
}
