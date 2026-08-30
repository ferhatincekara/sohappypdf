import { getPublicWebEnv } from "@/config/public-env";
import { AUTH_PATHS } from "@/features/auth/paths";
import {
  resolvePostAuthPath,
  safeRedirectPath,
} from "@/features/auth/safe-redirect";

export function resolveGoogleCallbackUrls(input: {
  next?: string | null;
  errorPath?: string;
}): {
  callbackURL: string;
  errorCallbackURL: string;
} {
  const appUrl = getPublicWebEnv().appUrl;
  const errorPath = input.errorPath ?? AUTH_PATHS.login;
  const safeNext = safeRedirectPath(input.next);

  return {
    callbackURL: `${appUrl}${resolvePostAuthPath(input.next)}`,
    errorCallbackURL:
      safeNext === null
        ? `${appUrl}${errorPath}`
        : `${appUrl}${errorPath}?next=${encodeURIComponent(safeNext)}`,
  };
}
