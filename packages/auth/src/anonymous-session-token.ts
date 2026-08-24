import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const ANONYMOUS_SESSION_TOKEN_PREFIX = "anon_";
export const ANONYMOUS_SESSION_TOKEN_BYTES = 32;

const TOKEN_SECRET_PATTERN = "[A-Za-z0-9_-]{43}";
const ANONYMOUS_SESSION_TOKEN_PATTERN = new RegExp(
  `^${ANONYMOUS_SESSION_TOKEN_PREFIX}${TOKEN_SECRET_PATTERN}$`,
);

export type GeneratedAnonymousSessionToken = {
  rawToken: string;
  tokenHash: string;
};

export function hashAnonymousSessionToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function anonymousSessionTokenHashesEqual(
  left: string,
  right: string,
): boolean {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");

  if (leftBuffer.length === 0 || leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function generateAnonymousSessionToken(): GeneratedAnonymousSessionToken {
  const rawToken = `${ANONYMOUS_SESSION_TOKEN_PREFIX}${randomBytes(ANONYMOUS_SESSION_TOKEN_BYTES).toString("base64url")}`;

  return {
    rawToken,
    tokenHash: hashAnonymousSessionToken(rawToken),
  };
}

export function isAnonymousSessionTokenFormat(value: string): boolean {
  return ANONYMOUS_SESSION_TOKEN_PATTERN.test(value);
}
