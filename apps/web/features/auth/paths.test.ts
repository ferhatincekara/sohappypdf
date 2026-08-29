import { describe, expect, test } from "bun:test";
import { AUTH_PATHS, loginPath, signupPath } from "@/features/auth/paths";

describe("auth paths", () => {
  test("keeps register and adds signup for marketing CTAs", () => {
    expect(AUTH_PATHS.register).toBe("/register");
    expect(AUTH_PATHS.signup).toBe("/signup");
    expect(AUTH_PATHS.login).toBe("/login");
    expect(AUTH_PATHS.app).toBe("/account/settings");
  });

  test("builds signup URLs without inventing a destination", () => {
    expect(signupPath()).toBe(AUTH_PATHS.signup);
    expect(signupPath(null)).toBe(AUTH_PATHS.signup);
    expect(signupPath("/account/billing")).toBe(
      `${AUTH_PATHS.signup}?next=${encodeURIComponent("/account/billing")}`,
    );
  });

  test("builds login URLs with a next destination", () => {
    expect(loginPath("/account/billing")).toBe(
      `${AUTH_PATHS.login}?next=${encodeURIComponent("/account/billing")}`,
    );
  });
});
