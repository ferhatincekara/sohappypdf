import { APP_ERROR_CODES, AppError } from "@repo/core";
import { type FileRecord, isFileExpired } from "@repo/files";
import { type FileFormat, normalizeFileFormat } from "./conversion-format.js";
import { type ConversionType, isConversionType } from "./conversion-type.js";
import {
  type ConversionFailureCode,
  isConversionFailureCode,
} from "./conversion-types.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const OWNER_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;
const MAX_IDEMPOTENCY_KEY_LENGTH = 128;
const MAX_ERROR_MESSAGE_LENGTH = 200;
const USABLE_SOURCE_FILE_STATUSES = new Set([
  "uploaded",
  "processing",
  "completed",
]);

function hasControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.codePointAt(0);

    if (code !== undefined && (code < 32 || code === 127)) {
      return true;
    }
  }

  return false;
}

export function assertUuid(id: string, message: string): string {
  if (!UUID_PATTERN.test(id)) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message,
    });
  }

  return id;
}

export function assertConversionId(id: string): string {
  return assertUuid(id, "Invalid conversion id");
}

export function assertConversionOwnerId(ownerId: string): string {
  if (!OWNER_ID_PATTERN.test(ownerId)) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid conversion owner",
    });
  }

  return ownerId;
}

export function assertFileReferenceId(id: string): string {
  return assertUuid(id, "Invalid file id");
}

export function assertConversionType(value: string): ConversionType {
  if (!isConversionType(value)) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Unsupported conversion",
    });
  }

  return value;
}

export function assertFileFormat(value: string, message: string): FileFormat {
  const format = normalizeFileFormat(value);

  if (format === undefined) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message,
    });
  }

  return format;
}

export function assertIdempotencyKey(
  value: string | undefined,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const key = value.trim();

  if (
    key.length === 0 ||
    key.length > MAX_IDEMPOTENCY_KEY_LENGTH ||
    hasControlCharacter(key)
  ) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid idempotency key",
    });
  }

  return key;
}

export function assertConversionFailureCode(
  value: string,
): ConversionFailureCode {
  if (!isConversionFailureCode(value)) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid conversion error",
    });
  }

  return value;
}

export function assertSafeErrorMessage(message: string): string {
  const trimmed = message.trim();

  if (
    trimmed.length === 0 ||
    trimmed.length > MAX_ERROR_MESSAGE_LENGTH ||
    hasControlCharacter(trimmed)
  ) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid conversion error",
    });
  }

  return trimmed;
}

export function assertSourceFileAvailable(
  file: FileRecord | undefined,
  now: Date,
): FileRecord {
  if (
    file === undefined ||
    file.deletedAt !== null ||
    isFileExpired(file, now) ||
    !USABLE_SOURCE_FILE_STATUSES.has(file.status)
  ) {
    throw new AppError({
      code: APP_ERROR_CODES.CONFLICT,
      message: "Source file unavailable",
    });
  }

  return file;
}

export function assertOwnedSourceFile(
  file: FileRecord | undefined,
  ownerId: string,
  now: Date,
): FileRecord {
  if (
    file === undefined ||
    file.ownerId !== ownerId ||
    file.deletedAt !== null ||
    isFileExpired(file, now)
  ) {
    throw new AppError({
      code: APP_ERROR_CODES.NOT_FOUND,
      message: "File not found",
    });
  }

  if (!USABLE_SOURCE_FILE_STATUSES.has(file.status)) {
    throw new AppError({
      code: APP_ERROR_CODES.CONFLICT,
      message: "Source file unavailable",
    });
  }

  return file;
}
