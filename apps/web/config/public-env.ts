export type PublicWebEnv = {
  appUrl: string;
  apiBaseUrl: string;
};

const DEFAULT_APP_URL = "http://localhost:3000";
const DEFAULT_API_BASE_URL = "http://localhost:3001";

function readPublicUrl(name: string, fallback: string): string {
  const value = process.env[name];

  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  return value.replace(/\/$/, "");
}

export function getPublicWebEnv(): PublicWebEnv {
  return {
    appUrl: readPublicUrl("NEXT_PUBLIC_APP_URL", DEFAULT_APP_URL),
    apiBaseUrl: readPublicUrl("NEXT_PUBLIC_API_BASE_URL", DEFAULT_API_BASE_URL),
  };
}
