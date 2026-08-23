import type { FileRecord } from "./file-types.js";

export const DEFAULT_FILE_TTL_MS = 2 * 60 * 60 * 1000;

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
  return file.status !== "deleted" && isFileExpired(file, now);
}
