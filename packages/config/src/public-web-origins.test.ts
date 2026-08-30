import { describe, expect, test } from "bun:test";
import { resolvePublicWebOrigins } from "./public-web-origins.js";

describe("resolvePublicWebOrigins", () => {
  test("includes apex and www from the API cookie domain", () => {
    expect(
      resolvePublicWebOrigins({
        BETTER_AUTH_SECRET: "a".repeat(32),
        BETTER_AUTH_URL: "https://api.sohappypdf.com",
        APP_URL: "https://sohappypdf.com",
        NODE_ENV: "production",
      }),
    ).toEqual(["https://sohappypdf.com", "https://www.sohappypdf.com"]);
  });

  test("still expands CORS when auth env is missing", () => {
    expect(
      resolvePublicWebOrigins({
        API_CORS_ORIGINS: "https://sohappypdf.com",
      }),
    ).toEqual(["https://sohappypdf.com", "https://www.sohappypdf.com"]);
  });
});
