export const ADMIN_AUTH_SURFACE_HEADER = "x-sohappypdf-auth-surface";
export const ADMIN_AUTH_SURFACE = "admin";
export const ADMIN_AUTH_COOKIE_PREFIX = "sohappypdf-admin";

export function isAdminAuthSurface(headers: Headers): boolean {
  return (
    headers.get(ADMIN_AUTH_SURFACE_HEADER)?.trim().toLowerCase() ===
    ADMIN_AUTH_SURFACE
  );
}

export function isAdminAuthCookieName(name: string): boolean {
  return name.includes(ADMIN_AUTH_COOKIE_PREFIX);
}

export function adminCookieHeader(
  cookies: ReadonlyArray<{ name: string; value: string }>,
): string | undefined {
  const adminCookies = cookies.filter((cookie) =>
    isAdminAuthCookieName(cookie.name),
  );

  if (adminCookies.length === 0) {
    return undefined;
  }

  return adminCookies
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}
