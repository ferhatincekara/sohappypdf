import { describe, expect, test } from "bun:test";
import { generateApiKeySecret } from "@repo/api-keys";
import { isAppError } from "@repo/core";
import type { Logger } from "@repo/logger";
import { createApp } from "../app.js";
import {
  createDefaultIdentityResolver,
  hasAuthenticationHints,
  requireAuthenticatedIdentity,
} from "./request-identity.js";

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

describe("request identity", () => {
  test("detects authentication hints without reading secret values", () => {
    expect(hasAuthenticationHints(new Headers())).toBe(false);
    expect(hasAuthenticationHints(new Headers({ cookie: "session=1" }))).toBe(
      true,
    );
    expect(
      hasAuthenticationHints(new Headers({ authorization: "Bearer key" })),
    ).toBe(true);
  });

  test("requires a resolved identity for protected work", () => {
    try {
      requireAuthenticatedIdentity({ kind: "anonymous" });
      throw new Error("expected authentication to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    }
  });

  test("resolves a valid API key to a non-secret principal", async () => {
    const generated = generateApiKeySecret();
    const app = createApp({
      config: { corsOrigins: [] },
      logger: silentLogger,
      resolveIdentity: createDefaultIdentityResolver({
        authenticateApiKey: async (rawKey) => {
          expect(rawKey).toBe(generated.rawKey);
          return {
            userId: "user_1",
            apiKeyId: "11111111-1111-4111-8111-111111111111",
          };
        },
      }),
    });
    app.get("/api/v1/__test/me", (c) => c.json(c.get("identity")));

    const response = await app.request("/api/v1/__test/me", {
      headers: {
        authorization: `Bearer ${generated.rawKey}`,
      },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      kind: "api-key",
      userId: "user_1",
      apiKeyId: "11111111-1111-4111-8111-111111111111",
    });
  });

  test("rejects invalid API keys with a consistent authentication error", async () => {
    const generated = generateApiKeySecret();
    const app = createApp({
      config: { corsOrigins: [] },
      logger: silentLogger,
      resolveIdentity: createDefaultIdentityResolver({
        authenticateApiKey: async () => null,
      }),
    });
    app.get("/api/v1/__test/me", (c) => c.json(c.get("identity")));

    const response = await app.request("/api/v1/__test/me", {
      headers: {
        authorization: `Bearer ${generated.rawKey}`,
      },
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
        requestId: response.headers.get("X-Request-Id"),
      },
    });
    expect(JSON.stringify(body).includes(generated.rawKey)).toBe(false);
  });
});
