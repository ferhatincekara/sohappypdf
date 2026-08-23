import { describe, expect, test } from "bun:test";
import { isAppError } from "@repo/core";
import { selectRateLimitKind } from "./rate-limit-identity.js";
import { createRateLimitKey } from "./rate-limit-key.js";

describe("createRateLimitKey", () => {
  test("keys anonymous traffic by IP", () => {
    expect(createRateLimitKey({ kind: "anonymous", ip: "203.0.113.10" })).toBe(
      "anonymous:ip:203.0.113.10",
    );
  });

  test("keys authenticated traffic by user ID", () => {
    expect(createRateLimitKey({ kind: "user", userId: "user_1" })).toBe(
      "user:user_1",
    );
  });

  test("keys API clients by client ID rather than a raw token", () => {
    expect(
      createRateLimitKey({
        kind: "api-client",
        apiClientId: "key_123",
        userId: "user_1",
      }),
    ).toBe("api:key_123");
  });

  test("does not accept email-like or token-like identities", () => {
    try {
      createRateLimitKey({
        kind: "user",
        userId: "ada@example.com",
      });
      throw new Error("expected identity to be rejected");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
    }
  });
});

describe("selectRateLimitKind", () => {
  test("selects the limiter class from the subject", () => {
    expect(selectRateLimitKind({ kind: "anonymous", ip: "203.0.113.10" })).toBe(
      "anonymous",
    );
    expect(selectRateLimitKind({ kind: "user", userId: "user_1" })).toBe(
      "authenticated",
    );
    expect(
      selectRateLimitKind({
        kind: "api-client",
        apiClientId: "key_123",
        userId: "user_1",
      }),
    ).toBe("api");
  });
});
