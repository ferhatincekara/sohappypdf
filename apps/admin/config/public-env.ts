const DEFAULT_ADMIN_URL = "http://localhost:3002";
const DEFAULT_API_BASE_URL = "http://localhost:3001";

/** Must match `@sohappypdf/auth` ADMIN_AUTH_SURFACE_HEADER / ADMIN_AUTH_SURFACE. */
export const ADMIN_AUTH_SURFACE_HEADER = "x-sohappypdf-auth-surface";
export const ADMIN_AUTH_SURFACE = "admin";

function readPublicUrl(value: string | undefined, fallback: string): string {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  return value.replace(/\/$/, "");
}

export function getPublicAdminUrl(): string {
  return readPublicUrl(process.env.NEXT_PUBLIC_ADMIN_URL, DEFAULT_ADMIN_URL);
}

export function getPublicApiBaseUrl(): string {
  return readPublicUrl(
    process.env.NEXT_PUBLIC_API_BASE_URL,
    DEFAULT_API_BASE_URL,
  );
}

export function toServerApiBaseUrl(apiBaseUrl: string): string {
  let parsed: URL;

  try {
    parsed = new URL(apiBaseUrl);
  } catch {
    return apiBaseUrl;
  }

  if (parsed.hostname === "localhost") {
    parsed.hostname = "127.0.0.1";
  }

  return parsed.origin;
}

export function getServerApiBaseUrl(): string {
  return toServerApiBaseUrl(getPublicApiBaseUrl());
}

export function getBrowserApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return getServerApiBaseUrl();
  }

  return "";
}
