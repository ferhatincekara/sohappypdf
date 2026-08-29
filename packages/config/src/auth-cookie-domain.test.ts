import { describe, expect, test } from "bun:test";
import { resolveAuthCookieDomain } from "./auth-cookie-domain.js";

describe("resolveAuthCookieDomain", () => {
  test("leaves local hosts without a shared cookie domain", () => {
    expect(
      resolveAuthCookieDomain({
        authBaseUrl: "http://localhost:3001",
        appUrl: "http://localhost:3000",
      }),
    ).toBeUndefined();
  });

  test("shares the parent domain between the API and the site", () => {
    expect(
      resolveAuthCookieDomain({
        authBaseUrl: "https://api.sohappypdf.com",
        appUrl: "https://sohappypdf.com",
      }),
    ).toBe("sohappypdf.com");
  });

  test("infers the parent domain from an api. auth host", () => {
    expect(
      resolveAuthCookieDomain({
        authBaseUrl: "https://api.sohappypdf.com",
      }),
    ).toBe("sohappypdf.com");
  });

  test("uses an explicit cookie domain", () => {
    expect(
      resolveAuthCookieDomain({
        authBaseUrl: "https://api.sohappypdf.com",
        cookieDomain: ".sohappypdf.com",
      }),
    ).toBe("sohappypdf.com");
  });

  test("ignores an explicit localhost cookie domain", () => {
    expect(
      resolveAuthCookieDomain({
        authBaseUrl: "https://api.sohappypdf.com",
        cookieDomain: "localhost",
      }),
    ).toBeUndefined();
  });
});
