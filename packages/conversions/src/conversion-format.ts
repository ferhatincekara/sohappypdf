export const FILE_FORMATS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "txt",
  "md",
  "json",
  "zip",
] as const;

export type FileFormat = (typeof FILE_FORMATS)[number];

const FILE_FORMAT_ALIASES: Record<string, FileFormat> = {
  jpeg: "jpg",
};

export function isFileFormat(value: string): value is FileFormat {
  return FILE_FORMATS.some((format) => format === value);
}

export function normalizeFileFormat(value: string): FileFormat | undefined {
  const normalized = value.trim().toLowerCase();
  const alias = FILE_FORMAT_ALIASES[normalized];

  if (alias !== undefined) {
    return alias;
  }

  if (isFileFormat(normalized)) {
    return normalized;
  }

  return undefined;
}

export function fileFormatFromFilename(
  filename: string,
): FileFormat | undefined {
  const separator = filename.lastIndexOf(".");

  if (separator < 0 || separator === filename.length - 1) {
    return undefined;
  }

  return normalizeFileFormat(filename.slice(separator + 1));
}
