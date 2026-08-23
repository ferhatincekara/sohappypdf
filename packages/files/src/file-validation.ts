import { DEFAULT_FILE_CONFIG } from "@repo/config";
import { APP_ERROR_CODES, AppError } from "@repo/core";

const MAX_FILENAME_LENGTH = 255;
const MAX_MIME_TYPE_LENGTH = 200;
export const MAX_FILE_SIZE_BYTES = DEFAULT_FILE_CONFIG.maxUploadFileSizeBytes;
const OWNER_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function hasControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.codePointAt(0);

    if (code !== undefined && (code < 32 || code === 127)) {
      return true;
    }
  }

  return false;
}

export function assertFileOwnerId(ownerId: string): string {
  if (!OWNER_ID_PATTERN.test(ownerId)) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid file owner",
    });
  }

  return ownerId;
}

export function assertFileId(id: string): string {
  if (!UUID_PATTERN.test(id)) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid file id",
    });
  }

  return id;
}

export function assertOriginalFilename(filename: string): string {
  const trimmed = filename.trim();

  if (
    trimmed.length === 0 ||
    trimmed.length > MAX_FILENAME_LENGTH ||
    trimmed === "." ||
    trimmed === ".." ||
    /[/\\]/.test(trimmed) ||
    hasControlCharacter(trimmed)
  ) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid original filename",
    });
  }

  return trimmed;
}

export function assertMimeType(mimeType: string): string {
  if (
    mimeType.length === 0 ||
    mimeType.length > MAX_MIME_TYPE_LENGTH ||
    /[\r\n]/.test(mimeType)
  ) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid MIME type",
    });
  }

  return mimeType;
}

export function assertFileSizeBytes(
  sizeBytes: number,
  maxFileSizeBytes = MAX_FILE_SIZE_BYTES,
): number {
  if (
    !Number.isInteger(sizeBytes) ||
    sizeBytes < 1 ||
    sizeBytes > maxFileSizeBytes
  ) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid file size",
    });
  }

  return sizeBytes;
}
