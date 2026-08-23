import { describe, expect, test } from "bun:test";
import { isHealthPath, toRateLimitSubject } from "./rate-limit-subject.js";

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
    expect(
      toRateLimitSubject(
        { kind: "api-key", userId: "user_1", apiKeyId: "key_123" },
        "203.0.113.10",
      ),
    ).toEqual({
      kind: "api-client",
      apiClientId: "key_123",
    });
  });
});

describe("isHealthPath", () => {
  test("exempts infrastructure health routes", () => {
    expect(isHealthPath("/health")).toBe(true);
    expect(isHealthPath("/api/v1/health")).toBe(true);
    expect(isHealthPath("/api/v1/files")).toBe(false);
  });
});
