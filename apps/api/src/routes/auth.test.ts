import { describe, expect, test } from "bun:test";
import { createAuth } from "@sohappypdf/auth";
import type { Logger } from "@sohappypdf/logger";
import { memoryAdapter } from "better-auth/adapters/memory";
import { createApp } from "../app.js";

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

const TEST_PASSWORD = "password1234";

function createMemoryAuth() {
  return createAuth({
    config: {
      secret: "a".repeat(32),
      baseUrl: "http://localhost:3001",
      runtimeEnv: "test",
      useSecureCookies: false,
    },
    database: memoryAdapter({
      user: [],
      session: [],
      account: [],
      verification: [],
    }),
    trustedOrigins: ["http://localhost:3000"],
  });
}

function createAuthApp() {
  const auth = createMemoryAuth();

  return createApp({
    config: { corsOrigins: ["http://localhost:3000"] },
    logger: silentLogger,
    resolveIdentity: async () => ({ kind: "anonymous" }),
    handleAuth: (request) => auth.handler(request),
  });
}

describe("Better Auth HTTP routes", () => {
  test("exposes Better Auth outside the v1 rate-limit surface", async () => {
    const app = createAuthApp();
    const response = await app.request("http://localhost:3001/api/auth/ok");

    expect(response.status).toBe(200);
  });

  test("creates a session from a trusted web origin", async () => {
    const app = createAuthApp();
    const response = await app.request(
      "http://localhost:3001/api/auth/sign-up/email",
      {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Ada Lovelace",
          email: "ada@example.com",
          password: TEST_PASSWORD,
        }),
      },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toBeString();
    expect(await response.json()).toMatchObject({
      user: {
        email: "ada@example.com",
      },
    });
  });

  test("returns no session without a cookie", async () => {
    const app = createAuthApp();
    const response = await app.request(
      "http://localhost:3001/api/auth/get-session",
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toBeNull();
  });

  test("returns invalid credentials for a wrong password", async () => {
    const app = createAuthApp();
    const originHeaders = {
      Origin: "http://localhost:3000",
      "Content-Type": "application/json",
    };

    await app.request("http://localhost:3001/api/auth/sign-up/email", {
      method: "POST",
      headers: originHeaders,
      body: JSON.stringify({
        name: "Ada Lovelace",
        email: "ada@example.com",
        password: TEST_PASSWORD,
      }),
    });

    const response = await app.request(
      "http://localhost:3001/api/auth/sign-in/email",
      {
        method: "POST",
        headers: originHeaders,
        body: JSON.stringify({
          email: "ada@example.com",
          password: "wrong-password",
        }),
      },
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      code: "INVALID_EMAIL_OR_PASSWORD",
    });
  });
});
