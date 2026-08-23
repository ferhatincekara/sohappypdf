import { describe, expect, test } from "bun:test";
import { AUTH_PATHS } from "./paths";
import {
  resolveGuestOnlyRedirect,
  resolvePostAuthPath,
  resolveProtectedRouteRedirect,
  safeRedirectPath,
} from "./safe-redirect";

describe("safeRedirectPath", () => {
  test("allows internal application paths", () => {
    expect(safeRedirectPath("/app")).toBe("/app");
    expect(safeRedirectPath("/login")).toBe("/login");
  });

  test("rejects open redirects", () => {
    expect(safeRedirectPath("https://evil.example")).toBeNull();
    expect(safeRedirectPath("//evil.example")).toBeNull();
    expect(safeRedirectPath("/\\evil.example")).toBeNull();
    expect(safeRedirectPath("evil.example")).toBeNull();
    expect(safeRedirectPath("/%2F%2Fevil.example")).toBeNull();
  });
});

describe("auth redirects", () => {
  test("sends unauthenticated users from the app to login", () => {
    expect(resolveProtectedRouteRedirect(false)).toBe(
      `${AUTH_PATHS.login}?next=${encodeURIComponent(AUTH_PATHS.app)}`,
    );
    expect(resolveProtectedRouteRedirect(true)).toBeNull();
  });

  test("sends authenticated users away from login and register", () => {
    expect(resolveGuestOnlyRedirect(true, "/app")).toBe(AUTH_PATHS.app);
    expect(resolveGuestOnlyRedirect(false, "/app")).toBeNull();
  });

  test("uses a safe post-auth destination", () => {
    expect(resolvePostAuthPath("/app")).toBe("/app");
    expect(resolvePostAuthPath("https://evil.example")).toBe(AUTH_PATHS.app);
    expect(resolvePostAuthPath(null)).toBe(AUTH_PATHS.app);
  });
});
