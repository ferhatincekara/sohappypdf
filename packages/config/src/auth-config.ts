import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import { loadAppConfig, type RuntimeEnv } from "./app-config.js";
import { type EnvSource, getRequiredEnv } from "./env.js";

const MIN_AUTH_SECRET_LENGTH = 32;

export type AuthConfig = {
  secret: string;
  baseUrl: string;
  runtimeEnv: RuntimeEnv;
  useSecureCookies: boolean;
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

export function loadAuthConfig(source: EnvSource = process.env): AuthConfig {
  const { runtimeEnv } = loadAppConfig(source);
  const baseUrl = parseAuthBaseUrl(
    getRequiredEnv("BETTER_AUTH_URL", source),
    runtimeEnv,
  );

  return {
    secret: parseAuthSecret(getRequiredEnv("BETTER_AUTH_SECRET", source)),
    baseUrl,
    runtimeEnv,
    useSecureCookies:
      runtimeEnv === "production" || new URL(baseUrl).protocol === "https:",
  };
}
