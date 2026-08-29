import type { ConversionSourceFormat } from "@/features/conversions/types/conversion";
import type { PublicFile } from "@/features/files/types/file";

const MIME_TO_SOURCE_FORMAT: Record<string, ConversionSourceFormat> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "pptx",
  "image/jpeg": "jpg",
  "image/png": "png",
};

const EXTENSION_TO_SOURCE_FORMAT: Record<string, ConversionSourceFormat> = {
  pdf: "pdf",
  doc: "doc",
  docx: "docx",
  xls: "xls",
  xlsx: "xlsx",
  ppt: "ppt",
  pptx: "pptx",
  jpg: "jpg",
  jpeg: "jpg",
  png: "png",
};

export function normalizeContentType(value: string): string {
  const [mediaType] = value.split(";");
  return mediaType?.trim().toLowerCase() ?? "";
}

export function sourceFormatFromMimeType(
  contentType: string,
): ConversionSourceFormat | undefined {
  return MIME_TO_SOURCE_FORMAT[normalizeContentType(contentType)];
}

export function sourceFormatFromFilename(
  filename: string,
): ConversionSourceFormat | undefined {
  const trimmed = filename.trim();
  const separator = trimmed.lastIndexOf(".");

  if (separator <= 0 || separator === trimmed.length - 1) {
    return undefined;
  }

  const extension = trimmed.slice(separator + 1).toLowerCase();
  return EXTENSION_TO_SOURCE_FORMAT[extension];
}

export function sourceFormatFromFile(file: {
  contentType: string;
  filename: string;
}): ConversionSourceFormat | undefined {
  return (
    sourceFormatFromMimeType(file.contentType) ??
    sourceFormatFromFilename(file.filename)
  );
}

export function sourceFormatFromPublicFile(
  file: PublicFile,
): ConversionSourceFormat | undefined {
  return sourceFormatFromFile(file);
}
