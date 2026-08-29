import { describe, expect, test } from "bun:test";
import { isApiKeyDeletable } from "@/features/api-keys/lib/is-api-key-deletable";
import type { PublicApiKey } from "@/features/api-keys/types/api-key";

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

describe("isApiKeyDeletable", () => {
  test("allows active keys and hides already revoked ones", () => {
    expect(isApiKeyDeletable(createApiKey())).toBe(true);
    expect(
      isApiKeyDeletable(
        createApiKey({
          status: "revoked",
          revokedAt: "2026-08-24T00:01:00.000Z",
        }),
      ),
    ).toBe(false);
  });
});
