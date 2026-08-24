import { listConversionCapabilities } from "./conversion-capability.js";
import { type FileFormat, normalizeFileFormat } from "./conversion-format.js";

const FILE_FORMAT_MIME_TYPES: Record<FileFormat, readonly string[]> = {
  pdf: ["application/pdf"],
  doc: ["application/msword"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  xls: ["application/vnd.ms-excel"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ppt: ["application/vnd.ms-powerpoint"],
  pptx: [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  webp: ["image/webp"],
  txt: ["text/plain"],
  md: ["text/markdown", "text/plain"],
  json: ["application/json"],
};

export function normalizeContentType(value: string): string {
  const [mediaType] = value.split(";");
  return mediaType?.trim().toLowerCase() ?? "";
}

export function listSourceFileFormats(): FileFormat[] {
  const formats = new Set<FileFormat>();

  for (const capability of listConversionCapabilities()) {
    for (const format of capability.sourceFormats) {
      formats.add(format);
    }
  }

  return [...formats];
}

export function listSupportedUploadMimeTypes(): string[] {
  const mimeTypes = new Set<string>();

  for (const format of listSourceFileFormats()) {
    for (const mimeType of FILE_FORMAT_MIME_TYPES[format]) {
      mimeTypes.add(mimeType);
    }
  }

  return [...mimeTypes];
}

export function isSupportedUploadMimeType(value: string): boolean {
  const mimeType = normalizeContentType(value);
  return listSupportedUploadMimeTypes().some(
    (supported) => supported === mimeType,
  );
}

export function fileFormatFromMimeType(value: string): FileFormat | undefined {
  const mimeType = normalizeContentType(value);

  for (const [format, mimeTypes] of Object.entries(FILE_FORMAT_MIME_TYPES)) {
    if (mimeTypes.some((supported) => supported === mimeType)) {
      return normalizeFileFormat(format);
    }
  }

  return undefined;
}

export function mimeTypeForFileFormat(format: FileFormat): string {
  const normalized = normalizeFileFormat(format) ?? format;
  const mimeType = FILE_FORMAT_MIME_TYPES[normalized][0];

  if (mimeType === undefined) {
    return "application/octet-stream";
  }

  return mimeType;
}
