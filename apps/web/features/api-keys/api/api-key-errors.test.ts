import { describe, expect, test } from "bun:test";
import {
  API_KEY_ERROR_KEYS,
  mapApiKeyError,
} from "@/features/api-keys/api/api-key-errors";

describe("api key error mapping", () => {
  test("maps validation, auth, and rate-limit failures to safe keys", () => {
    expect(
      mapApiKeyError({
        kind: "api",
        code: "VALIDATION_ERROR",
        message: "Invalid API key name",
      }),
    ).toBe(API_KEY_ERROR_KEYS.invalidName);
    expect(
      mapApiKeyError({ kind: "api", code: "UNAUTHORIZED", status: 401 }),
    ).toBe(API_KEY_ERROR_KEYS.unauthorized);
    expect(
      mapApiKeyError({ kind: "api", code: "FORBIDDEN", status: 403 }),
    ).toBe(API_KEY_ERROR_KEYS.forbidden);
    expect(
      mapApiKeyError({ kind: "api", code: "NOT_FOUND", status: 404 }),
    ).toBe(API_KEY_ERROR_KEYS.notFound);
    expect(
      mapApiKeyError({ kind: "api", code: "RATE_LIMITED", status: 429 }),
    ).toBe(API_KEY_ERROR_KEYS.rateLimited);
    expect(mapApiKeyError({ kind: "network", status: 0 })).toBe(
      API_KEY_ERROR_KEYS.networkFailure,
    );
  });

  test("does not keep internal messages", () => {
    expect(
      mapApiKeyError({
        kind: "api",
        code: "INTERNAL_ERROR",
        message: "relation api_keys does not exist",
      }),
    ).toBe(API_KEY_ERROR_KEYS.unexpected);
  });
});
