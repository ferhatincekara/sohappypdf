import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import { type EnvSource, getOptionalEnv } from "./env.js";

export const RUNTIME_ENVS = ["development", "test", "production"] as const;

export type RuntimeEnv = (typeof RUNTIME_ENVS)[number];

export const LOG_LEVELS = ["error", "warn", "info", "debug"] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

export type AppConfig = {
  runtimeEnv: RuntimeEnv;
  logLevel: LogLevel;
};

function isRuntimeEnv(value: string): value is RuntimeEnv {
  return value === "development" || value === "test" || value === "production";
}

function isLogLevel(value: string): value is LogLevel {
  return (
    value === "error" ||
    value === "warn" ||
    value === "info" ||
    value === "debug"
  );
}

function parseRuntimeEnv(value: string | undefined): RuntimeEnv {
  if (value === undefined) {
    return "development";
  }

  if (isRuntimeEnv(value)) {
    return value;
  }

  throw new AppError({
    code: APP_ERROR_CODES.CONFIGURATION_ERROR,
    message: `Invalid NODE_ENV: expected development, test, or production`,
  });
}

function parseLogLevel(value: string | undefined): LogLevel {
  if (value === undefined) {
    return "info";
  }

  if (isLogLevel(value)) {
    return value;
  }

  throw new AppError({
    code: APP_ERROR_CODES.CONFIGURATION_ERROR,
    message: `Invalid LOG_LEVEL: expected error, warn, info, or debug`,
  });
}

export function loadAppConfig(source: EnvSource = process.env): AppConfig {
  return {
    runtimeEnv: parseRuntimeEnv(getOptionalEnv("NODE_ENV", source)),
    logLevel: parseLogLevel(getOptionalEnv("LOG_LEVEL", source)),
  };
}
