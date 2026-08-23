import { APP_ERROR_CODES, AppError } from "@repo/core";
import { type EnvSource, getOptionalEnv } from "./env.js";

export type RateLimitRedisConfig = {
  restUrl: string;
  restToken: string;
};

export type RateLimitConfig = {
  redis: RateLimitRedisConfig | undefined;
  anonymousPerMinute: number;
  authenticatedPerMinute: number;
  apiPerMinute: number;
};

export const DEFAULT_RATE_LIMIT_CONFIG = {
  anonymousPerMinute: 30,
  authenticatedPerMinute: 120,
  apiPerMinute: 60,
} as const;

function parsePositiveInteger(
  name: string,
  value: string | undefined,
  fallback: number,
): number {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new AppError({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message: `Invalid ${name}`,
    });
  }

  return parsed;
}

function parseRedisConfig(source: EnvSource): RateLimitRedisConfig | undefined {
  const restUrl = getOptionalEnv("UPSTASH_REDIS_REST_URL", source);
  const restToken = getOptionalEnv("UPSTASH_REDIS_REST_TOKEN", source);

  if (restUrl === undefined && restToken === undefined) {
    return undefined;
  }

  if (restUrl === undefined || restToken === undefined) {
    throw new AppError({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message: "Upstash Redis REST URL and token must both be set",
    });
  }

  let parsed: URL;

  try {
    parsed = new URL(restUrl);
  } catch {
    throw new AppError({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message: "Invalid Upstash Redis REST URL",
    });
  }

  if (parsed.protocol !== "https:") {
    throw new AppError({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message: "Invalid Upstash Redis REST URL",
    });
  }

  return {
    restUrl,
    restToken,
  };
}

export function loadRateLimitConfig(
  source: EnvSource = process.env,
): RateLimitConfig {
  return {
    redis: parseRedisConfig(source),
    anonymousPerMinute: parsePositiveInteger(
      "RATE_LIMIT_ANONYMOUS_PER_MINUTE",
      getOptionalEnv("RATE_LIMIT_ANONYMOUS_PER_MINUTE", source),
      DEFAULT_RATE_LIMIT_CONFIG.anonymousPerMinute,
    ),
    authenticatedPerMinute: parsePositiveInteger(
      "RATE_LIMIT_AUTHENTICATED_PER_MINUTE",
      getOptionalEnv("RATE_LIMIT_AUTHENTICATED_PER_MINUTE", source),
      DEFAULT_RATE_LIMIT_CONFIG.authenticatedPerMinute,
    ),
    apiPerMinute: parsePositiveInteger(
      "RATE_LIMIT_API_PER_MINUTE",
      getOptionalEnv("RATE_LIMIT_API_PER_MINUTE", source),
      DEFAULT_RATE_LIMIT_CONFIG.apiPerMinute,
    ),
  };
}
