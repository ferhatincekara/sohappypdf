import { describe, expect, test } from "bun:test";
import { isAppError } from "@sohappypdf/core";
import { selectRateLimitKind } from "./rate-limit-identity.js";
import {
  createAnonymousRateLimitKeys,
  createRateLimitKey,
} from "./rate-limit-key.js";

describe("createRateLimitKey", () => {
  test("keys anonymous traffic by hashed IP fingerprint and session", () => {
    const subject = {
      kind: "anonymous" as const,
      sessionId: "550e8400-e29b-41d4-a716-446655440010",
      ipFingerprint: "abc123def4567890",
    };

    expect(createAnonymousRateLimitKeys(subject)).toEqual({
      ip: "anonymous:ip:abc123def4567890",
      session: "anonymous:session:550e8400-e29b-41d4-a716-446655440010",
    });
    expect(createRateLimitKey(subject)).toBe(
      "anonymous:session:550e8400-e29b-41d4-a716-446655440010",
    );
    expect(createRateLimitKey(subject).includes("203.0.113.10")).toBe(false);
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
    expect(
      selectRateLimitKind({
        kind: "anonymous",
        sessionId: "unidentified",
        ipFingerprint: "abc123def4567890",
      }),
    ).toBe("anonymous");
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
