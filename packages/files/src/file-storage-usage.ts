import type { FileRecord } from "./file-types.js";

export function isActiveStorageFile(file: FileRecord, now: Date): boolean {
  return (
    file.status !== "deleted" &&
    file.deletedAt === null &&
    file.purgedAt === null &&
    file.expiresAt.getTime() > now.getTime()
  );
}

export function sumActiveStorageBytesForOwner(
  files: readonly FileRecord[],
  ownerId: string,
  now: Date,
): number {
  return files.reduce((total, file) => {
    if (file.ownerId !== ownerId || !isActiveStorageFile(file, now)) {
      return total;
    }

    return total + file.sizeBytes;
  }, 0);
}
