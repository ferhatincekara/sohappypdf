export type PublicWebEnv = {
  appUrl: string;
  apiBaseUrl: string;
  maxUploadFileSizeBytes: number;
};

const DEFAULT_APP_URL = "http://localhost:3000";
const DEFAULT_API_BASE_URL = "http://localhost:3001";
export const DEFAULT_MAX_UPLOAD_FILE_SIZE_BYTES = 1024 * 1024 * 1024;

function readPublicUrl(name: string, fallback: string): string {
  const value = process.env[name];

  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  return value.replace(/\/$/, "");
}

function readPublicPositiveInteger(name: string, fallback: number): number {
  const value = process.env[name];

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
  return {
    appUrl: readPublicUrl("NEXT_PUBLIC_APP_URL", DEFAULT_APP_URL),
    apiBaseUrl: readPublicUrl("NEXT_PUBLIC_API_BASE_URL", DEFAULT_API_BASE_URL),
    maxUploadFileSizeBytes: readPublicPositiveInteger(
      "NEXT_PUBLIC_MAX_UPLOAD_FILE_SIZE",
      DEFAULT_MAX_UPLOAD_FILE_SIZE_BYTES,
    ),
  };
}

export function getPublicApiV1BaseUrl(): string {
  return `${getPublicWebEnv().apiBaseUrl}/api/v1`;
}
