import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const API_KEY_PRODUCT_PREFIX = "shpdf_";
export const API_KEY_LOOKUP_LENGTH = 8;
export const API_KEY_SECRET_BYTES = 32;

const LOOKUP_PATTERN = `[A-Za-z0-9_-]{${API_KEY_LOOKUP_LENGTH}}`;
const SECRET_PATTERN = "[A-Za-z0-9_-]{43}";
const API_KEY_PATTERN = new RegExp(
  `^${API_KEY_PRODUCT_PREFIX}${LOOKUP_PATTERN}_${SECRET_PATTERN}$`,
);

export type GeneratedApiKey = {
  rawKey: string;
  keyPrefix: string;
};

/**
 * Hash high-entropy API keys with SHA-256.
 *
 * Keys are 32 random bytes, so slow password hashes would add request
 * latency without a meaningful brute-force benefit. A global HMAC secret
 * is unnecessary because each key is already an unguessable per-key secret.
 */
export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

export function apiKeyHashesEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");

  if (leftBuffer.length === 0 || leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function generateApiKeySecret(): GeneratedApiKey {
  const lookup = randomBytes(6)
    .toString("base64url")
    .slice(0, API_KEY_LOOKUP_LENGTH);
  const secret = randomBytes(API_KEY_SECRET_BYTES).toString("base64url");
  const keyPrefix = `${API_KEY_PRODUCT_PREFIX}${lookup}`;

  return {
    rawKey: `${keyPrefix}_${secret}`,
    keyPrefix,
  };
}

export function isApiKeyFormat(value: string): boolean {
  return API_KEY_PATTERN.test(value);
}

export function extractApiKeyPrefix(rawKey: string): string | undefined {
  if (!isApiKeyFormat(rawKey)) {
    return undefined;
  }

  return rawKey.slice(0, API_KEY_PRODUCT_PREFIX.length + API_KEY_LOOKUP_LENGTH);
}
