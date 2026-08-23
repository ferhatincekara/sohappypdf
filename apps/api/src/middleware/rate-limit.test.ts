import { describe, expect, test } from "bun:test";
import { APP_ERROR_CODES } from "@repo/core";
import type { Logger } from "@repo/logger";
import type { RateLimitDecision, RateLimitSubject } from "@repo/rate-limit";
import { createApp } from "../app.js";
import { applyRateLimitHeaders } from "./rate-limit.js";

const silentLogger: Logger = {
  level: "error",
  error() {},
  warn() {},
  info() {},
  debug() {},
  child() {
    return silentLogger;
  },
};

const denied: RateLimitDecision = {
  allowed: false,
  failedOpen: false,
  kind: "anonymous",
  limit: 30,
  remaining: 0,
  resetAtMs: 1_700_000_010_000,
};

function createLimitedApp(
  checkRateLimit: (subject: RateLimitSubject) => Promise<RateLimitDecision>,
) {
  const app = createApp({
    config: { corsOrigins: [] },
    logger: silentLogger,
    resolveIdentity: async () => ({ kind: "anonymous" }),
    checkRateLimit,
  });

  app.get("/api/v1/__test/limited", (c) => c.json({ ok: true }));
  return app;
}

describe("rateLimitMiddleware", () => {
  test("does not rate limit health endpoints", async () => {
    let checked = false;
    const app = createLimitedApp(async () => {
      checked = true;
      return denied;
    });

    const response = await app.request("/api/v1/health");

    expect(response.status).toBe(200);
    expect(checked).toBe(false);
  });

  test("returns 429 with Retry-After when the limiter rejects the request", async () => {
    const app = createLimitedApp(async () => denied);
    const response = await app.request("/api/v1/__test/limited", {
      headers: {
        "x-real-ip": "203.0.113.10",
      },
    });
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get("RateLimit-Limit")).toBe("30");
    expect(response.headers.get("RateLimit-Remaining")).toBe("0");
    expect(response.headers.get("Retry-After")).toBeDefined();
    expect(body).toEqual({
      error: {
        code: APP_ERROR_CODES.RATE_LIMITED,
        message: "Too many requests",
        requestId: response.headers.get("X-Request-Id"),
      },
    });
  });

  test("allows the request when the limiter fails open", async () => {
    const app = createLimitedApp(async () => ({
      allowed: true,
      failedOpen: true,
      kind: "anonymous",
      limit: 30,
      remaining: 30,
      resetAtMs: 0,
    }));

    const response = await app.request("/api/v1/__test/limited", {
      headers: {
        "x-real-ip": "203.0.113.10",
      },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("RateLimit-Limit")).toBeNull();
    expect(response.headers.get("Retry-After")).toBeNull();
  });

  test("selects the authenticated limiter for session identities", async () => {
    let subject: RateLimitSubject | undefined;
    const app = createApp({
      config: { corsOrigins: [] },
      logger: silentLogger,
      resolveIdentity: async () => ({
        kind: "session",
        userId: "user_1",
        sessionId: "session_1",
      }),
      checkRateLimit: async (value) => {
        subject = value;
        return {
          allowed: true,
          failedOpen: false,
          kind: "authenticated",
          limit: 120,
          remaining: 119,
          resetAtMs: 1_700_000_010_000,
        };
      },
    });
    app.get("/api/v1/__test/limited", (c) => c.json({ ok: true }));

    const response = await app.request("/api/v1/__test/limited");

    expect(response.status).toBe(200);
    expect(subject).toEqual({ kind: "user", userId: "user_1" });
  });
});

describe("applyRateLimitHeaders", () => {
  test("does not invent headers when the limiter failed open", () => {
    const headers = new Headers();
    applyRateLimitHeaders(
      headers,
      {
        allowed: true,
        failedOpen: true,
        kind: "anonymous",
        limit: 30,
        remaining: 30,
        resetAtMs: 0,
      },
      1_700_000_000_000,
    );

    expect(headers.get("RateLimit-Limit")).toBeNull();
    expect(headers.get("Retry-After")).toBeNull();
  });

  test("sets Retry-After from the limiter reset time", () => {
    const headers = new Headers();
    applyRateLimitHeaders(headers, denied, 1_700_000_000_400);

    expect(headers.get("Retry-After")).toBe("10");
    expect(headers.get("RateLimit-Reset")).toBe("1700000010");
  });
});
