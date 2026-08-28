export const ANONYMOUS_SESSION_COOKIE_NAME = "spdf_anon";

export type AnonymousSessionCookieOptions = {
  secure: boolean;
  maxAgeSeconds: number;
};

export function createAnonymousSessionCookieOptions(
  options: AnonymousSessionCookieOptions,
) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "Lax" as const,
    secure: options.secure,
    maxAge: options.maxAgeSeconds,
  };
}

export function createAnonymousSessionCookieClearOptions(secure: boolean) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "Lax" as const,
    secure,
  };
}
