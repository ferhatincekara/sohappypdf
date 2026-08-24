import { APP_PATHS } from "@/features/app-shell/config/app-paths";
import { AUTH_PATHS, signupPath } from "@/features/auth/paths";

export function resolveStartHref(
  isAuthenticated: boolean,
): typeof APP_PATHS.overview | typeof AUTH_PATHS.signup {
  return isAuthenticated ? APP_PATHS.overview : AUTH_PATHS.signup;
}

export function resolveProHref(isAuthenticated: boolean): string {
  return isAuthenticated ? APP_PATHS.billing : signupPath(APP_PATHS.billing);
}

export function resolveSignInHref(
  isAuthenticated: boolean,
): typeof APP_PATHS.overview | typeof AUTH_PATHS.login {
  return isAuthenticated ? APP_PATHS.overview : AUTH_PATHS.login;
}

export function resolveMarketingCtas(isAuthenticated: boolean): {
  startHref: string;
  proHref: string;
  signInHref: string;
} {
  return {
    startHref: resolveStartHref(isAuthenticated),
    proHref: resolveProHref(isAuthenticated),
    signInHref: resolveSignInHref(isAuthenticated),
  };
}
