import { describe, expect, test } from "bun:test";
import {
  ADMIN_AUTH_SURFACE,
  ADMIN_AUTH_SURFACE_HEADER,
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
});
