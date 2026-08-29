export type PublicWebEnv = {
  appUrl: string;
  apiBaseUrl: string;
  maxUploadFileSizeBytes: number;
};

const DEFAULT_APP_URL = "http://localhost:3000";
const DEFAULT_API_BASE_URL = "http://localhost:3001";
export const DEFAULT_MAX_UPLOAD_FILE_SIZE_BYTES = 1024 * 1024 * 1024;

function readPublicUrl(value: string | undefined, fallback: string): string {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  return value.replace(/\/$/, "");
}

function readPublicPositiveInteger(
  value: string | undefined,
  fallback: number,
): number {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

export function getPublicWebEnv(): PublicWebEnv {
  // Next.js only inlines static `process.env.NEXT_PUBLIC_*` reads into the
  // browser bundle. `process.env[name]` stays undefined in the client and
  // falls back to localhost even when Vercel has the production URL.
  return {
    appUrl: readPublicUrl(process.env.NEXT_PUBLIC_APP_URL, DEFAULT_APP_URL),
    apiBaseUrl: readPublicUrl(
      process.env.NEXT_PUBLIC_API_BASE_URL,
      DEFAULT_API_BASE_URL,
    ),
    maxUploadFileSizeBytes: readPublicPositiveInteger(
      process.env.NEXT_PUBLIC_MAX_UPLOAD_FILE_SIZE,
      DEFAULT_MAX_UPLOAD_FILE_SIZE_BYTES,
    ),
  };
}

export function getPublicApiV1BaseUrl(): string {
  return `${getPublicWebEnv().apiBaseUrl}/v1`;
}

/**
 * Server-to-server API origin. Rewrites localhost to 127.0.0.1 so Node/undici
 * does not race IPv6 (::1) against Bun, which can close the socket.
 * Browser clients use the web origin and Next.js rewrites instead.
 */
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
  return toServerApiBaseUrl(getPublicWebEnv().apiBaseUrl);
}

export function getServerApiV1BaseUrl(): string {
  return `${getServerApiBaseUrl()}/v1`;
}

/**
 * Browser clients call the web origin. Next.js rewrites `/v1` and `/api/auth`
 * to the API host so session cookies stay first-party.
 */
export function getBrowserApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return getServerApiBaseUrl();
  }

  return "";
}
