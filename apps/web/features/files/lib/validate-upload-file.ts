import { getPublicWebEnv } from "@/config/public-env";
import { resolveUploadContentType } from "./supported-upload-types";

const MAX_FILENAME_LENGTH = 255;

export const UPLOAD_VALIDATION_KEYS = {
  missingFile: "missingFile",
  multipleFiles: "multipleFiles",
  invalidFilename: "invalidFilename",
  unsupportedType: "unsupportedType",
  emptyFile: "emptyFile",
  fileTooLarge: "fileTooLarge",
} as const;

export type UploadValidationKey =
  (typeof UPLOAD_VALIDATION_KEYS)[keyof typeof UPLOAD_VALIDATION_KEYS];

export type UploadValidationResult =
  | { ok: true; contentType: string }
  | { ok: false; errorKey: UploadValidationKey };

function hasControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.codePointAt(0);

    if (code !== undefined && (code < 32 || code === 127)) {
      return true;
    }
  }

  return false;
}

function isValidOriginalFilename(filename: string): boolean {
  const trimmed = filename.trim();

  return !(
    trimmed.length === 0 ||
    trimmed.length > MAX_FILENAME_LENGTH ||
    trimmed === "." ||
    trimmed === ".." ||
    /[/\\]/.test(trimmed) ||
    hasControlCharacter(trimmed)
  );
}

export function validateSelectedFiles(
  files: FileList | File[] | null | undefined,
  maxUploadFileSizeBytes = getPublicWebEnv().maxUploadFileSizeBytes,
): UploadValidationResult & { file?: File } {
  if (files === null || files === undefined || files.length === 0) {
    return { ok: false, errorKey: UPLOAD_VALIDATION_KEYS.missingFile };
  }

  if (files.length > 1) {
    return { ok: false, errorKey: UPLOAD_VALIDATION_KEYS.multipleFiles };
  }

  const file = files[0];

  if (file === undefined) {
    return { ok: false, errorKey: UPLOAD_VALIDATION_KEYS.missingFile };
  }

  const result = validateUploadFile(file, maxUploadFileSizeBytes);

  if (!result.ok) {
    return result;
  }

  return { ...result, file };
}

export function validateUploadFile(
  file: File,
  maxUploadFileSizeBytes = getPublicWebEnv().maxUploadFileSizeBytes,
): UploadValidationResult {
  if (!isValidOriginalFilename(file.name)) {
    return { ok: false, errorKey: UPLOAD_VALIDATION_KEYS.invalidFilename };
  }

  const contentType = resolveUploadContentType(file);

  if (contentType === undefined) {
    return { ok: false, errorKey: UPLOAD_VALIDATION_KEYS.unsupportedType };
  }

  if (!Number.isInteger(file.size) || file.size < 1) {
    return { ok: false, errorKey: UPLOAD_VALIDATION_KEYS.emptyFile };
  }

  if (file.size > maxUploadFileSizeBytes) {
    return { ok: false, errorKey: UPLOAD_VALIDATION_KEYS.fileTooLarge };
  }

  return { ok: true, contentType };
}
