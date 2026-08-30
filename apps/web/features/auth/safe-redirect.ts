import { AUTH_PATHS, loginPath } from "@/features/auth/paths";

function decodeRedirectCandidate(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export function safeRedirectPath(
  value: string | null | undefined,
): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();

  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\")
  ) {
    return null;
  }

  const decoded = decodeRedirectCandidate(trimmed);

  if (
    decoded === null ||
    !decoded.startsWith("/") ||
    decoded.startsWith("//") ||
    decoded.includes("://") ||
    decoded.includes("\\")
  ) {
    return null;
  }

  const pathname = trimmed.split("?")[0]?.split("#")[0];

  if (pathname === undefined || pathname.length === 0) {
    return null;
  }

  return pathname;
}

export function resolvePostAuthPath(next?: string | null): string {
  return safeRedirectPath(next) ?? AUTH_PATHS.afterAuth;
}

export function resolveGuestOnlyRedirect(
  isAuthenticated: boolean,
  next?: string | null,
): string | null {
  if (!isAuthenticated) {
    return null;
  }

  return resolvePostAuthPath(next);
}

export function resolveProtectedRouteRedirect(
  isAuthenticated: boolean,
): string | null {
  if (isAuthenticated) {
    return null;
  }

  return loginPath(AUTH_PATHS.app);
}
