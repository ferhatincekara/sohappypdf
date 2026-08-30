import { describe, expect, test } from "bun:test";
import { loadAuthConfig } from "@sohappypdf/config";
import { isAppError } from "@sohappypdf/core";

describe("loadAuthConfig", () => {
  test("loads a valid authentication configuration", () => {
    const config = loadAuthConfig({
      BETTER_AUTH_SECRET: "a".repeat(32),
      BETTER_AUTH_URL: "http://localhost:3000/",
      NODE_ENV: "development",
    });

    expect(config.secret).toBe("a".repeat(32));
    expect(config.baseUrl).toBe("http://localhost:3000");
    expect(config.runtimeEnv).toBe("development");
    expect(config.useSecureCookies).toBe(false);
    expect(config.cookieDomain).toBeUndefined();
    expect(config.google).toBeUndefined();
  });

  test("loads Google credentials as a complete pair", () => {
    const config = loadAuthConfig({
      BETTER_AUTH_SECRET: "a".repeat(32),
      BETTER_AUTH_URL: "http://localhost:3000",
      NODE_ENV: "development",
      GOOGLE_CLIENT_ID: "google-client-id",
      GOOGLE_CLIENT_SECRET: "google-client-secret",
    });

    expect(config.google).toEqual({
      clientId: "google-client-id",
      clientSecret: "google-client-secret",
    });
  });

  test("rejects a partial Google credential pair", () => {
    try {
      loadAuthConfig({
        BETTER_AUTH_SECRET: "a".repeat(32),
        BETTER_AUTH_URL: "http://localhost:3000",
        GOOGLE_CLIENT_ID: "google-client-id",
      });
      throw new Error("expected configuration to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("CONFIGURATION_ERROR");
      }
    }
  });

  test("shares session cookies across the API and site hosts", () => {
    const config = loadAuthConfig({
      BETTER_AUTH_SECRET: "a".repeat(32),
      BETTER_AUTH_URL: "https://api.sohappypdf.com",
      APP_URL: "https://sohappypdf.com",
      NODE_ENV: "production",
    });

    expect(config.cookieDomain).toBe("sohappypdf.com");
  });

  test("requires HTTPS and secure cookies in production", () => {
    const config = loadAuthConfig({
      BETTER_AUTH_SECRET: "a".repeat(32),
      BETTER_AUTH_URL: "https://sohappypdf.com",
      NODE_ENV: "production",
    });

    expect(config.useSecureCookies).toBe(true);
  });

  test("rejects a short secret", () => {
    try {
      loadAuthConfig({
        BETTER_AUTH_SECRET: "too-short",
        BETTER_AUTH_URL: "http://localhost:3000",
      });
      throw new Error("expected configuration to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("CONFIGURATION_ERROR");
      }
    }
  });

  test("rejects HTTP in production", () => {
    try {
      loadAuthConfig({
        BETTER_AUTH_SECRET: "a".repeat(32),
        BETTER_AUTH_URL: "http://sohappypdf.com",
        NODE_ENV: "production",
      });
      throw new Error("expected configuration to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("CONFIGURATION_ERROR");
      }
    }
  });
});
