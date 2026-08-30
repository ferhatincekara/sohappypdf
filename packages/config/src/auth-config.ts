import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import { loadAppConfig, type RuntimeEnv } from "./app-config.js";
import { resolveAuthCookieDomain } from "./auth-cookie-domain.js";
import { type EnvSource, getOptionalEnv, getRequiredEnv } from "./env.js";

const MIN_AUTH_SECRET_LENGTH = 32;

export type GoogleAuthConfig = {
  clientId: string;
  clientSecret: string;
};

export type AuthConfig = {
  secret: string;
  baseUrl: string;
  runtimeEnv: RuntimeEnv;
  useSecureCookies: boolean;
  cookieDomain?: string;
  google?: GoogleAuthConfig;
};

function parseAuthSecret(value: string): string {
  if (value.length < MIN_AUTH_SECRET_LENGTH) {
    throw new AppError({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message: `BETTER_AUTH_SECRET must be at least ${MIN_AUTH_SECRET_LENGTH} characters`,
    });
  }

  return value;
}

function parseAuthBaseUrl(value: string, runtimeEnv: RuntimeEnv): string {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new AppError({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message: "Invalid BETTER_AUTH_URL",
    });
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new AppError({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message: "Invalid BETTER_AUTH_URL",
    });
  }

  if (runtimeEnv === "production" && parsed.protocol !== "https:") {
    throw new AppError({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message: "BETTER_AUTH_URL must use HTTPS in production",
    });
  }

  const pathname =
    parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/$/, "");

  return `${parsed.origin}${pathname}`;
}

function parseGoogleAuthConfig(
  source: EnvSource,
): GoogleAuthConfig | undefined {
  const clientId = getOptionalEnv("GOOGLE_CLIENT_ID", source);
  const clientSecret = getOptionalEnv("GOOGLE_CLIENT_SECRET", source);

  if (clientId === undefined && clientSecret === undefined) {
    return undefined;
  }

  if (clientId === undefined || clientSecret === undefined) {
    throw new AppError({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message: "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must both be set",
    });
  }

  return { clientId, clientSecret };
}

export function loadAuthConfig(source: EnvSource = process.env): AuthConfig {
  const { runtimeEnv } = loadAppConfig(source);
  const baseUrl = parseAuthBaseUrl(
    getRequiredEnv("BETTER_AUTH_URL", source),
    runtimeEnv,
  );

  const explicitCookieDomain = getOptionalEnv("AUTH_COOKIE_DOMAIN", source);
  const cookieDomain = resolveAuthCookieDomain({
    authBaseUrl: baseUrl,
    appUrl:
      getOptionalEnv("APP_URL", source) ??
      getOptionalEnv("NEXT_PUBLIC_APP_URL", source),
    cookieDomain: explicitCookieDomain,
  });

  if (explicitCookieDomain !== undefined && cookieDomain === undefined) {
    throw new AppError({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message: "Invalid AUTH_COOKIE_DOMAIN",
    });
  }

  return {
    secret: parseAuthSecret(getRequiredEnv("BETTER_AUTH_SECRET", source)),
    baseUrl,
    runtimeEnv,
    useSecureCookies:
      runtimeEnv === "production" || new URL(baseUrl).protocol === "https:",
    cookieDomain,
    google: parseGoogleAuthConfig(source),
  };
}
