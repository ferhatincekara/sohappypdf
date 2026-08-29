import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";

const MAX_API_KEY_NAME_LENGTH = 80;
const USER_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;
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

export function assertApiKeyUserId(userId: string): string {
  if (!USER_ID_PATTERN.test(userId)) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid user id",
    });
  }

  return userId;
}

export function assertApiKeyId(id: string): string {
  if (!UUID_PATTERN.test(id)) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid API key id",
    });
  }

  return id;
}

export function assertApiKeyName(name: string): string {
  const trimmed = name.trim();

  if (
    trimmed.length === 0 ||
    trimmed.length > MAX_API_KEY_NAME_LENGTH ||
    hasControlCharacter(trimmed)
  ) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid API key name",
    });
  }

  return trimmed;
}

export function assertApiKeyExpiration(
  expiresAt: Date | undefined,
  now: Date,
): Date | null {
  if (expiresAt === undefined) {
    return null;
  }

  if (
    Number.isNaN(expiresAt.getTime()) ||
    expiresAt.getTime() <= now.getTime()
  ) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid API key expiration",
    });
  }

  return expiresAt;
}
