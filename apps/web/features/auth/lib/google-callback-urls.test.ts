import { describe, expect, test } from "bun:test";
import { getPublicWebEnv } from "@/config/public-env";
import { resolveGoogleCallbackUrls } from "@/features/auth/lib/google-callback-urls";
import { AUTH_PATHS } from "@/features/auth/paths";

describe("resolveGoogleCallbackUrls", () => {
  test("returns absolute web URLs for success and error redirects", () => {
    const appUrl = getPublicWebEnv().appUrl;
    const urls = resolveGoogleCallbackUrls({
      next: "/account/billing",
      errorPath: AUTH_PATHS.login,
    });

    expect(urls.callbackURL).toBe(`${appUrl}/account/billing`);
    expect(urls.errorCallbackURL).toBe(
      `${appUrl}${AUTH_PATHS.login}?next=${encodeURIComponent("/account/billing")}`,
    );
  });

  test("rejects an open redirect in both callback URLs", () => {
    const appUrl = getPublicWebEnv().appUrl;
    const urls = resolveGoogleCallbackUrls({
      next: "https://evil.example",
    });

    expect(urls.callbackURL).toBe(`${appUrl}${AUTH_PATHS.afterAuth}`);
    expect(urls.errorCallbackURL).toBe(`${appUrl}${AUTH_PATHS.login}`);
  });
});
