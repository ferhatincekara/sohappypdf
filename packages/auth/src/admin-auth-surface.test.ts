import { describe, expect, test } from "bun:test";
import {
  ADMIN_AUTH_COOKIE_PREFIX,
  ADMIN_AUTH_SURFACE,
  ADMIN_AUTH_SURFACE_HEADER,
  adminCookieHeader,
  isAdminAuthSurface,
} from "./admin-auth-surface.js";

describe("admin auth surface", () => {
  test("requires the admin surface header", () => {
    expect(isAdminAuthSurface(new Headers())).toBe(false);
    expect(
      isAdminAuthSurface(
        new Headers({ Origin: "https://admin.sohappypdf.com" }),
      ),
    ).toBe(false);
    expect(
      isAdminAuthSurface(
        new Headers({ [ADMIN_AUTH_SURFACE_HEADER]: ADMIN_AUTH_SURFACE }),
      ),
    ).toBe(true);
  });

  test("forwards only admin-prefixed cookies", () => {
    expect(
      adminCookieHeader([
        { name: "better-auth.session_token", value: "web" },
        {
          name: `__Secure-${ADMIN_AUTH_COOKIE_PREFIX}.session_token`,
          value: "admin",
        },
      ]),
    ).toBe(`__Secure-${ADMIN_AUTH_COOKIE_PREFIX}.session_token=admin`);
    expect(
      adminCookieHeader([{ name: "better-auth.session_token", value: "web" }]),
    ).toBeUndefined();
  });
});
