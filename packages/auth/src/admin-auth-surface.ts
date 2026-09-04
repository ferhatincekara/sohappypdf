export const ADMIN_AUTH_SURFACE_HEADER = "x-sohappypdf-auth-surface";
export const ADMIN_AUTH_SURFACE = "admin";
export const ADMIN_AUTH_COOKIE_PREFIX = "sohappypdf-admin";

export function isAdminAuthSurface(headers: Headers): boolean {
  return (
    headers.get(ADMIN_AUTH_SURFACE_HEADER)?.trim().toLowerCase() ===
    ADMIN_AUTH_SURFACE
  );
}
