import { describe, expect, test } from "bun:test";
import { APP_PATHS } from "@/features/app-shell/config/app-paths";
import { AUTH_PATHS, signupPath } from "@/features/auth/paths";
import {
  BILLING_API_HREF,
  resolveApiBillingHref,
  resolveMarketingCtas,
  resolveNavGetStartedHref,
  resolveProHref,
  resolveSignInHref,
  resolveStartHref,
} from "@/features/marketing/lib/marketing-cta";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";

describe("marketing CTAs", () => {
  test("sends navbar Try for free to tools, and hero Start for free to signup", () => {
    expect(resolveNavGetStartedHref()).toBe(MARKETING_PATHS.tools);
    expect(resolveMarketingCtas(false).navStartHref).toBe(MARKETING_PATHS.tools);
    expect(resolveStartHref(false)).toBe(AUTH_PATHS.signup);
    expect(resolveStartHref(true)).toBe(MARKETING_PATHS.tools);
    expect(resolveMarketingCtas(false).startHref).toBe(AUTH_PATHS.signup);
    expect(resolveSignInHref(false)).toBe(AUTH_PATHS.login);
    expect(resolveSignInHref(true)).toBe(APP_PATHS.settings);
  });

  test("routes Pro through signup then the existing billing flow", () => {
    expect(resolveProHref(false)).toBe(signupPath(APP_PATHS.billing));
    expect(resolveProHref(true)).toBe(APP_PATHS.billing);
    expect(resolveProHref(false)).toContain("next=");
    expect(resolveProHref(false)).toContain(
      encodeURIComponent(APP_PATHS.billing),
    );
  });

  test("routes API credit packs through signup then the billing API section", () => {
    expect(resolveApiBillingHref(false)).toBe(signupPath(BILLING_API_HREF));
    expect(resolveApiBillingHref(true)).toBe(BILLING_API_HREF);
    expect(resolveApiBillingHref(false)).toContain("next=");
    expect(resolveApiBillingHref(false)).toContain(
      encodeURIComponent(BILLING_API_HREF),
    );
  });
  test("does not send authenticated users through signup", () => {
    const ctas = resolveMarketingCtas(true);

    expect(ctas.startHref).toBe(MARKETING_PATHS.tools);
    expect(ctas.proHref).toBe(APP_PATHS.billing);
    expect(ctas.apiHref).toBe(BILLING_API_HREF);
    expect(ctas.signInHref).toBe(APP_PATHS.settings);
    expect(ctas.startHref).not.toContain("signup");
    expect(ctas.proHref).not.toContain("signup");
    expect(ctas.apiHref).not.toContain("signup");
  });
});
