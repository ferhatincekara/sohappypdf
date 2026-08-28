import { APP_ERROR_CODES, AppError } from "@repo/core";
import { type EnvSource, getOptionalEnv } from "./env.js";

export const DEFAULT_API_STARTER_CREDITS = 2_000;
export const DEFAULT_API_GROWTH_CREDITS = 10_000;
export const DEFAULT_API_SCALE_CREDITS = 100_000;

export const API_PRODUCT_KEYS = ["starter", "growth", "scale"] as const;
export type ApiProductKey = (typeof API_PRODUCT_KEYS)[number];

export type ApiCreditConfig = {
  starterMonthlyCredits: number;
  growthMonthlyCredits: number;
  scaleMonthlyCredits: number;
};

function parseNonNegativeInt(
  value: string | undefined,
  fallback: number,
  name: string,
): number {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new AppError({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message: `Invalid ${name}`,
    });
  }

  return parsed;
}

export function loadApiCreditConfig(
  source: EnvSource = process.env,
): ApiCreditConfig {
  return {
    starterMonthlyCredits: parseNonNegativeInt(
      getOptionalEnv("API_STARTER_CREDITS", source),
      DEFAULT_API_STARTER_CREDITS,
      "API_STARTER_CREDITS",
    ),
    growthMonthlyCredits: parseNonNegativeInt(
      getOptionalEnv("API_GROWTH_CREDITS", source),
      DEFAULT_API_GROWTH_CREDITS,
      "API_GROWTH_CREDITS",
    ),
    scaleMonthlyCredits: parseNonNegativeInt(
      getOptionalEnv("API_SCALE_CREDITS", source),
      DEFAULT_API_SCALE_CREDITS,
      "API_SCALE_CREDITS",
    ),
  };
}

export function isApiProductKey(value: string): value is ApiProductKey {
  return API_PRODUCT_KEYS.some((key) => key === value);
}
