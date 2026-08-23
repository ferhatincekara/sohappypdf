import type { PublicFile, PublicFileStatus } from "../types/file";

export const DELETABLE_FILE_STATUSES: readonly PublicFileStatus[] = [
  "pending",
  "uploaded",
  "processing",
  "completed",
  "failed",
];

export function isFileDeletable(file: PublicFile): boolean {
  return DELETABLE_FILE_STATUSES.some((status) => status === file.status);
}
