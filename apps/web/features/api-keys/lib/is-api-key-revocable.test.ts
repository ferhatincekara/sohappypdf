import { describe, expect, test } from "bun:test";
import type { PublicApiKey } from "../types/api-key";
import { isApiKeyRevocable } from "./is-api-key-revocable";

function createApiKey(overrides: Partial<PublicApiKey> = {}): PublicApiKey {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Production",
    keyPrefix: "shpdf_abcd1234",
    status: "active",
    createdAt: "2026-08-24T00:00:00.000Z",
    lastUsedAt: null,
    expiresAt: null,
    revokedAt: null,
    ...overrides,
  };
}

describe("isApiKeyRevocable", () => {
  test("allows active keys and hides already revoked ones", () => {
    expect(isApiKeyRevocable(createApiKey())).toBe(true);
    expect(
      isApiKeyRevocable(
        createApiKey({
          status: "revoked",
          revokedAt: "2026-08-24T00:01:00.000Z",
        }),
      ),
    ).toBe(false);
  });
});
