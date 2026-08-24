import { describe, expect, test } from "bun:test";
import { APP_PATHS } from "@/features/app-shell/config/app-paths";
import { AUTH_PATHS, signupPath } from "@/features/auth/paths";
import {
  resolveMarketingCtas,
  resolveProHref,
  resolveSignInHref,
  resolveStartHref,
} from "./marketing-cta";

describe("marketing CTAs", () => {
  test("sends guests to signup and developers to the app", () => {
    expect(resolveStartHref(false)).toBe(AUTH_PATHS.signup);
    expect(resolveStartHref(true)).toBe(APP_PATHS.overview);
    expect(resolveSignInHref(false)).toBe(AUTH_PATHS.login);
    expect(resolveSignInHref(true)).toBe(APP_PATHS.overview);
  });

  test("routes Pro through signup then the existing billing flow", () => {
    expect(resolveProHref(false)).toBe(signupPath(APP_PATHS.billing));
    expect(resolveProHref(true)).toBe(APP_PATHS.billing);
    expect(resolveProHref(false)).toContain("next=");
    expect(resolveProHref(false)).toContain(
      encodeURIComponent(APP_PATHS.billing),
    );
  });

  test("does not send authenticated users through signup", () => {
    const ctas = resolveMarketingCtas(true);

    expect(ctas.startHref).toBe(APP_PATHS.overview);
    expect(ctas.proHref).toBe(APP_PATHS.billing);
    expect(ctas.signInHref).toBe(APP_PATHS.overview);
    expect(ctas.startHref).not.toContain("signup");
    expect(ctas.proHref).not.toContain("signup");
  });
});
