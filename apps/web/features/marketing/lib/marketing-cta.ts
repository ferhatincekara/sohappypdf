import { APP_PATHS } from "@/features/app-shell/config/app-paths";
import { AUTH_PATHS, signupPath } from "@/features/auth/paths";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";

export function resolveStartHref(
  _isAuthenticated: boolean,
): typeof MARKETING_PATHS.tools {
  return MARKETING_PATHS.tools;
}

export const BILLING_API_HREF = `${APP_PATHS.billing}?section=api`;

export function resolveProHref(isAuthenticated: boolean): string {
  return isAuthenticated ? APP_PATHS.billing : signupPath(APP_PATHS.billing);
}

export function resolveApiBillingHref(isAuthenticated: boolean): string {
  return isAuthenticated ? BILLING_API_HREF : signupPath(BILLING_API_HREF);
}

export function resolveSignInHref(
  isAuthenticated: boolean,
): typeof APP_PATHS.settings | typeof AUTH_PATHS.login {
  return isAuthenticated ? APP_PATHS.settings : AUTH_PATHS.login;
}

export function resolveMarketingCtas(isAuthenticated: boolean): {
  startHref: string;
  proHref: string;
  apiHref: string;
  signInHref: string;
} {
  return {
    startHref: resolveStartHref(isAuthenticated),
    proHref: resolveProHref(isAuthenticated),
    apiHref: resolveApiBillingHref(isAuthenticated),
    signInHref: resolveSignInHref(isAuthenticated),
  };
}
