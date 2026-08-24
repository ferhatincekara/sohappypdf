import { APP_ERROR_CODES, AppError } from "@repo/core";
import { type EnvSource, getOptionalEnv } from "./env.js";

export const DEFAULT_API_STARTER_CREDITS = 1_000;
export const DEFAULT_API_GROWTH_CREDITS = 10_000;
export const DEFAULT_API_SCALE_CREDITS = 100_000;

export const API_PRODUCT_KEYS = ["starter", "growth", "scale"] as const;
export type ApiProductKey = (typeof API_PRODUCT_KEYS)[number];

export type PolarApiPackProduct = {
  productId: string;
  credits: number;
};

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

export function parsePolarApiCreditPacks(
  value: string | undefined,
): PolarApiPackProduct[] {
  if (value === undefined || value.trim() === "") {
    return [];
  }

  const packs: PolarApiPackProduct[] = [];

  for (const part of value.split(",")) {
    const trimmed = part.trim();

    if (trimmed.length === 0) {
      continue;
    }

    const separator = trimmed.lastIndexOf(":");
    const productId =
      separator === -1 ? trimmed : trimmed.slice(0, separator).trim();
    const creditsValue =
      separator === -1 ? undefined : trimmed.slice(separator + 1).trim();

    if (productId.length === 0) {
      throw new AppError({
        code: APP_ERROR_CODES.CONFIGURATION_ERROR,
        message: "Invalid POLAR_API_CREDIT_PACKS",
      });
    }

    const credits =
      creditsValue === undefined || creditsValue.length === 0
        ? 500
        : parseNonNegativeInt(creditsValue, 500, "POLAR_API_CREDIT_PACKS");

    if (credits < 1) {
      throw new AppError({
        code: APP_ERROR_CODES.CONFIGURATION_ERROR,
        message: "Invalid POLAR_API_CREDIT_PACKS",
      });
    }

    packs.push({ productId, credits });
  }

  return packs;
}

export function isApiProductKey(value: string): value is ApiProductKey {
  return API_PRODUCT_KEYS.some((key) => key === value);
}
