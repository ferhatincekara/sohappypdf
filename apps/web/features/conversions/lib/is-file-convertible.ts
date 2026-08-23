import type { PublicFile, PublicFileStatus } from "@/features/files/types/file";
import { listTargetFormats } from "./conversion-capabilities";
import { sourceFormatFromPublicFile } from "./source-format";

export const CONVERTIBLE_FILE_STATUSES: readonly PublicFileStatus[] = [
  "uploaded",
  "processing",
  "completed",
];

export function isConvertibleFileStatus(status: PublicFileStatus): boolean {
  return CONVERTIBLE_FILE_STATUSES.some((value) => value === status);
}

export function isFileConvertible(file: PublicFile): boolean {
  if (!isConvertibleFileStatus(file.status)) {
    return false;
  }

  const sourceFormat = sourceFormatFromPublicFile(file);

  if (sourceFormat === undefined) {
    return false;
  }

  return listTargetFormats(sourceFormat).length > 0;
}
