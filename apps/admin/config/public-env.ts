export type PublicAdminEnv = {
  apiBaseUrl: string;
};

const DEFAULT_API_BASE_URL = "http://localhost:3001";

function readPublicUrl(name: string, fallback: string): string {
  const value = process.env[name];

  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  return value.replace(/\/$/, "");
}

export function getPublicAdminEnv(): PublicAdminEnv {
  return {
    apiBaseUrl: readPublicUrl("NEXT_PUBLIC_API_BASE_URL", DEFAULT_API_BASE_URL),
  };
}

export function getAdminApiV1BaseUrl(): string {
  return `${getPublicAdminEnv().apiBaseUrl}/api/v1`;
}
