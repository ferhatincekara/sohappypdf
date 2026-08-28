import { APP_ERROR_CODES, AppError } from "@repo/core";
import { type EnvSource, getOptionalEnv } from "./env.js";

export const DEFAULT_FREE_AI_CREDITS = 0;
export const DEFAULT_PRO_AI_CREDITS = 200;

export type AiConfig = {
  freeMonthlyCredits: number;
  proMonthlyCredits: number;
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

export function loadAiConfig(source: EnvSource = process.env): AiConfig {
  return {
    freeMonthlyCredits: parseNonNegativeInt(
      getOptionalEnv("FREE_AI_CREDITS", source),
      DEFAULT_FREE_AI_CREDITS,
      "FREE_AI_CREDITS",
    ),
    proMonthlyCredits: parseNonNegativeInt(
      getOptionalEnv("PRO_AI_CREDITS", source),
      DEFAULT_PRO_AI_CREDITS,
      "PRO_AI_CREDITS",
    ),
  };
}
