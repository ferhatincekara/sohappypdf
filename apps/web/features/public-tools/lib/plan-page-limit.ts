import {
  formatFromPublicFile,
  resolveUploadContentType,
} from "@/features/files/lib/supported-upload-types";

export function isPdfUploadFile(file: File): boolean {
  const contentType = resolveUploadContentType(file);

  if (contentType === undefined) {
    return false;
  }

  return (
    formatFromPublicFile({
      contentType,
      filename: file.name,
    }) === "pdf"
  );
}

export function exceedsPlanPageLimit(
  pageCount: number,
  maxPagesPerFile: number | null | undefined,
): boolean {
  return (
    maxPagesPerFile !== null &&
    maxPagesPerFile !== undefined &&
    pageCount > maxPagesPerFile
  );
}

export function shouldHoldPdfForPageLimit(input: {
  file: File;
  accessResolved: boolean;
  maxPagesPerFile: number | null;
}): boolean {
  if (!isPdfUploadFile(input.file)) {
    return false;
  }

  if (!input.accessResolved) {
    return true;
  }

  return input.maxPagesPerFile !== null;
}
