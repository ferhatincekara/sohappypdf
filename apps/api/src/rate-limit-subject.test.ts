import { describe, expect, test } from "bun:test";
import {
  isHealthPath,
  isRateLimitExemptPath,
  toRateLimitSubject,
} from "./rate-limit-subject.js";

describe("toRateLimitSubject", () => {
  test("maps anonymous requests to an IP subject", () => {
    expect(toRateLimitSubject({ kind: "anonymous" }, "203.0.113.10")).toEqual({
      kind: "anonymous",
      ip: "203.0.113.10",
    });
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
    expect(isHealthPath("/api/v1/health")).toBe(true);
    expect(isHealthPath("/api/v1/files")).toBe(false);
  });
});

describe("isRateLimitExemptPath", () => {
  test("exempts Polar webhook delivery", () => {
    expect(isRateLimitExemptPath("/api/v1/billing/webhooks")).toBe(true);
    expect(isRateLimitExemptPath("/api/v1/billing")).toBe(false);
  });

  test("exempts the public OpenAPI document", () => {
    expect(isRateLimitExemptPath("/api/v1/openapi.json")).toBe(true);
  });
});
