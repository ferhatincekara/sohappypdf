import type { PublicFile, PublicFileStatus } from "@/features/files/types/file";

export const DOWNLOADABLE_FILE_STATUSES: readonly PublicFileStatus[] = [
  "uploaded",
  "processing",
  "completed",
];

export function isFileDownloadable(file: PublicFile): boolean {
  return DOWNLOADABLE_FILE_STATUSES.some((status) => status === file.status);
}
