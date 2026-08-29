import { describe, expect, test } from "bun:test";
import { fingerprintClientIp } from "./auth/ip-fingerprint.js";
import {
  isAnonymousApiPath,
  isHealthPath,
  isRateLimitExemptPath,
  toRateLimitSubject,
} from "./rate-limit-subject.js";

describe("toRateLimitSubject", () => {
  test("maps anonymous requests to a session and IP fingerprint subject", () => {
    const subject = toRateLimitSubject(
      { kind: "anonymous", sessionId: "550e8400-e29b-41d4-a716-446655440010" },
      "203.0.113.10",
    );

    expect(subject).toEqual({
      kind: "anonymous",
      sessionId: "550e8400-e29b-41d4-a716-446655440010",
      ipFingerprint: fingerprintClientIp("203.0.113.10"),
    });
    expect(JSON.stringify(subject).includes("203.0.113.10")).toBe(false);
  });

  test("maps session identity to a user subject", () => {
    expect(
      toRateLimitSubject(
        { kind: "session", userId: "user_1", sessionId: "session_1" },
        "203.0.113.10",
      ),
    ).toEqual({
      kind: "user",
      userId: "user_1",
    });
  });

  test("maps API-key identity to a client subject", () => {
    const subject = toRateLimitSubject(
      { kind: "api-key", userId: "user_1", apiKeyId: "key_123" },
      "203.0.113.10",
    );

    expect(subject).toEqual({
      kind: "api-client",
      apiClientId: "key_123",
      userId: "user_1",
    });
    expect(JSON.stringify(subject).includes("shpdf_")).toBe(false);
  });
});

describe("isHealthPath", () => {
  test("exempts infrastructure health routes", () => {
    expect(isHealthPath("/health")).toBe(true);
    expect(isHealthPath("/v1/health")).toBe(true);
    expect(isHealthPath("/v1/files")).toBe(false);
  });
});

describe("isRateLimitExemptPath", () => {
  test("exempts Polar webhook delivery", () => {
    expect(isRateLimitExemptPath("/v1/billing/webhooks")).toBe(true);
    expect(isRateLimitExemptPath("/v1/billing")).toBe(false);
  });

  test("exempts the public OpenAPI document", () => {
    expect(isRateLimitExemptPath("/v1/openapi.json")).toBe(true);
  });
});

describe("isAnonymousApiPath", () => {
  test("identifies anonymous tool API routes", () => {
    expect(isAnonymousApiPath("/v1/anonymous/files/upload")).toBe(true);
    expect(isAnonymousApiPath("/v1/files/upload")).toBe(false);
  });
});
