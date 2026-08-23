/**
 * Client-safe mirror of supported upload source formats from the conversion
 * domain. Keep aligned with `listSourceFileFormats` + MIME mappings.
 * Do not import `@repo/conversions` in browser code.
 */
const SUPPORTED_UPLOAD_TYPES = [
  {
    format: "pdf",
    extensions: [".pdf"],
    mimeTypes: ["application/pdf"],
  },
  {
    format: "doc",
    extensions: [".doc"],
    mimeTypes: ["application/msword"],
  },
  {
    format: "docx",
    extensions: [".docx"],
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  },
  {
    format: "xls",
    extensions: [".xls"],
    mimeTypes: ["application/vnd.ms-excel"],
  },
  {
    format: "xlsx",
    extensions: [".xlsx"],
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
  },
  {
    format: "ppt",
    extensions: [".ppt"],
    mimeTypes: ["application/vnd.ms-powerpoint"],
  },
  {
    format: "pptx",
    extensions: [".pptx"],
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
  },
  {
    format: "jpg",
    extensions: [".jpg", ".jpeg"],
    mimeTypes: ["image/jpeg"],
  },
  {
    format: "png",
    extensions: [".png"],
    mimeTypes: ["image/png"],
  },
] as const;

export type SupportedUploadFormat =
  (typeof SUPPORTED_UPLOAD_TYPES)[number]["format"];

export function listSupportedUploadMimeTypes(): string[] {
  return SUPPORTED_UPLOAD_TYPES.flatMap((type) => [...type.mimeTypes]);
}

export function listSupportedUploadExtensions(): string[] {
  return SUPPORTED_UPLOAD_TYPES.flatMap((type) => [...type.extensions]);
}

export function getFileInputAccept(): string {
  return [
    ...listSupportedUploadMimeTypes(),
    ...listSupportedUploadExtensions(),
  ].join(",");
}

export function normalizeContentType(value: string): string {
  const [mediaType] = value.split(";");
  return mediaType?.trim().toLowerCase() ?? "";
}

export function isSupportedUploadMimeType(value: string): boolean {
  const mimeType = normalizeContentType(value);
  return listSupportedUploadMimeTypes().some(
    (supported) => supported === mimeType,
  );
}

function extensionFromFilename(filename: string): string | undefined {
  const trimmed = filename.trim();
  const separator = trimmed.lastIndexOf(".");

  if (separator <= 0 || separator === trimmed.length - 1) {
    return undefined;
  }

  return trimmed.slice(separator).toLowerCase();
}

export function isSupportedUploadExtension(filename: string): boolean {
  const extension = extensionFromFilename(filename);

  if (extension === undefined) {
    return false;
  }

  return listSupportedUploadExtensions().some(
    (supported) => supported === extension,
  );
}

export function mimeTypeFromFilename(filename: string): string | undefined {
  const extension = extensionFromFilename(filename);

  if (extension === undefined) {
    return undefined;
  }

  const match = SUPPORTED_UPLOAD_TYPES.find((type) =>
    type.extensions.some((supported) => supported === extension),
  );

  return match?.mimeTypes[0];
}

export function resolveUploadContentType(file: {
  name: string;
  type: string;
}): string | undefined {
  if (isSupportedUploadMimeType(file.type)) {
    return normalizeContentType(file.type);
  }

  return mimeTypeFromFilename(file.name);
}
