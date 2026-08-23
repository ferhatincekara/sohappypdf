import { describe, expect, test } from "bun:test";
import type { CreateApiKeyResponse } from "../types/api-key";
import {
  createdSecretPersistedInCache,
  takeCreatedApiKeySecret,
  toListCacheApiKey,
} from "./created-api-key-secret";

const created: CreateApiKeyResponse = {
  apiKey: {
    id: "11111111-1111-4111-8111-111111111111",
    name: "CI",
    keyPrefix: "shpdf_abcd1234",
    status: "active",
    createdAt: "2026-08-24T00:00:00.000Z",
    lastUsedAt: null,
    expiresAt: null,
    revokedAt: null,
  },
  secret: "shpdf_abcd1234_test-secret-not-for-production",
};

describe("created API key secret handling", () => {
  test("extracts the one-time secret without putting it on the list record", () => {
    const extracted = takeCreatedApiKeySecret(created);
    const cached = toListCacheApiKey(created);

    expect(extracted.secret).toBe(created.secret);
    expect(cached).toEqual(created.apiKey);
    expect(cached).not.toHaveProperty("secret");
    expect(createdSecretPersistedInCache(cached)).toBe(false);
    expect(createdSecretPersistedInCache(extracted)).toBe(true);
  });
});
