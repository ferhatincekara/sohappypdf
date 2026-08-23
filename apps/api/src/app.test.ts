import { describe, expect, test } from "bun:test";
import { APP_ERROR_CODES, AppError } from "@repo/core";
import type { Logger } from "@repo/logger";
import { createApp } from "./app.js";
import type { RequestIdentity } from "./auth/request-identity.js";

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

function createTestApp(identity: RequestIdentity = { kind: "anonymous" }) {
  return createApp({
    config: { corsOrigins: [] },
    logger: silentLogger,
    resolveIdentity: async () => identity,
  });
}

describe("createApp", () => {
  test("returns a liveness payload from GET /health", async () => {
    const app = createTestApp();
    const response = await app.request("/health");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  test("exposes the same health check on the v1 API", async () => {
    const app = createTestApp();
    const response = await app.request("/api/v1/health");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  test("assigns and echoes a generated request ID", async () => {
    const app = createTestApp();
    const response = await app.request("/health");
    const requestId = response.headers.get("X-Request-Id");

    expect(requestId).toBeString();
    expect(requestId?.length).toBeGreaterThanOrEqual(8);
  });

  test("reuses a well-formed client request ID", async () => {
    const app = createTestApp();
    const response = await app.request("/health", {
      headers: {
        "X-Request-Id": "req_client-01",
      },
    });

    expect(response.headers.get("X-Request-Id")).toBe("req_client-01");
  });

  test("replaces an untrusted client request ID", async () => {
    const app = createTestApp();
    const response = await app.request("/health", {
      headers: {
        "X-Request-Id": "../secret",
      },
    });

    expect(response.headers.get("X-Request-Id")).not.toBe("../secret");
    expect(response.headers.get("X-Request-Id")?.length).toBeGreaterThanOrEqual(
      8,
    );
  });

  test("returns a consistent 404 error body", async () => {
    const app = createTestApp();
    const response = await app.request("/missing");
    const body = await response.json();
    const requestId = response.headers.get("X-Request-Id");

    expect(response.status).toBe(404);
    expect(body).toEqual({
      error: {
        code: APP_ERROR_CODES.NOT_FOUND,
        message: "The requested resource could not be found",
        requestId,
      },
    });
  });

  test("maps application errors to the public error format", async () => {
    const app = createTestApp();
    app.get("/__test/error", () => {
      throw new AppError({
        code: APP_ERROR_CODES.VALIDATION_ERROR,
        message: "Invalid request",
      });
    });

    const response = await app.request("/__test/error");
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: {
        code: APP_ERROR_CODES.VALIDATION_ERROR,
        message: "Invalid request",
        requestId: response.headers.get("X-Request-Id"),
      },
    });
    expect(JSON.stringify(body)).not.toContain("stack");
  });

  test("hides unexpected error details", async () => {
    const app = createTestApp();
    app.get("/__test/boom", () => {
      throw new Error("database password=super-secret");
    });

    const response = await app.request("/__test/boom");
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      error: {
        code: APP_ERROR_CODES.INTERNAL_ERROR,
        message: "An unexpected error occurred",
        requestId: response.headers.get("X-Request-Id"),
      },
    });
    expect(JSON.stringify(body)).not.toContain("super-secret");
  });

  test("does not reflect arbitrary CORS origins", async () => {
    const app = createTestApp();
    const response = await app.request("/health", {
      headers: {
        Origin: "https://evil.example",
      },
    });

    expect(response.headers.get("Access-Control-Allow-Origin")).not.toBe("*");
    expect(response.headers.get("Access-Control-Allow-Origin")).not.toBe(
      "https://evil.example",
    );
  });

  test("allows only configured CORS origins", async () => {
    const app = createApp({
      config: { corsOrigins: ["https://sohappypdf.com"] },
      logger: silentLogger,
      resolveIdentity: async () => ({ kind: "anonymous" }),
    });
    const response = await app.request("/health", {
      headers: {
        Origin: "https://sohappypdf.com",
      },
    });

    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://sohappypdf.com",
    );
  });

  test("allows the conversion Idempotency-Key header in CORS preflight", async () => {
    const app = createApp({
      config: { corsOrigins: ["http://localhost:3000"] },
      logger: silentLogger,
      resolveIdentity: async () => ({ kind: "anonymous" }),
    });
    const response = await app.request("/api/v1/conversions", {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type,idempotency-key",
      },
    });

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Headers")).toMatch(
      /Idempotency-Key/i,
    );
  });

  test("attaches resolved identity without trusting request bodies", async () => {
    const app = createTestApp({
      kind: "session",
      userId: "user_1",
      sessionId: "session_1",
    });
    app.post("/__test/me", async (c) => {
      return c.json(c.get("identity"));
    });

    const response = await app.request("/__test/me", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: "forged_user" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      kind: "session",
      userId: "user_1",
      sessionId: "session_1",
    });
  });
});
