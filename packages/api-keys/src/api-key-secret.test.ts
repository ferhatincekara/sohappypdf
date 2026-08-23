import { describe, expect, test } from "bun:test";
import {
  API_KEY_PRODUCT_PREFIX,
  apiKeyHashesEqual,
  extractApiKeyPrefix,
  generateApiKeySecret,
  hashApiKey,
  isApiKeyFormat,
} from "./api-key-secret.js";

describe("generateApiKeySecret", () => {
  test("creates a recognizable high-entropy key", () => {
    const generated = generateApiKeySecret();

    expect(isApiKeyFormat(generated.rawKey)).toBe(true);
    expect(generated.keyPrefix.startsWith(API_KEY_PRODUCT_PREFIX)).toBe(true);
    expect(generated.rawKey.startsWith(`${generated.keyPrefix}_`)).toBe(true);
    expect(generated.rawKey.includes("@")).toBe(false);
  });

  test("does not embed user identifiers in the secret", () => {
    const generated = generateApiKeySecret();

    expect(generated.rawKey.includes("user_")).toBe(false);
    expect(extractApiKeyPrefix(generated.rawKey)).toBe(generated.keyPrefix);
  });
});

describe("hashApiKey", () => {
  test("is deterministic and one-way", () => {
    const generated = generateApiKeySecret();
    const hash = hashApiKey(generated.rawKey);

    expect(hash).toBe(hashApiKey(generated.rawKey));
    expect(hash).not.toBe(generated.rawKey);
    expect(hash.includes(generated.rawKey)).toBe(false);
    expect(apiKeyHashesEqual(hash, hashApiKey(generated.rawKey))).toBe(true);
    expect(apiKeyHashesEqual(hash, hashApiKey(`${generated.rawKey}x`))).toBe(
      false,
    );
  });
});

describe("isApiKeyFormat", () => {
  test("rejects tokens, emails, and incomplete keys", () => {
    expect(isApiKeyFormat("not-a-key")).toBe(false);
    expect(isApiKeyFormat("ada@example.com")).toBe(false);
    expect(isApiKeyFormat("shpdf_short")).toBe(false);
    expect(isApiKeyFormat(`Bearer ${generateApiKeySecret().rawKey}`)).toBe(
      false,
    );
  });
});
