import { APP_ERROR_CODES, AppError } from "@repo/core";
import { type EnvSource, getOptionalEnv } from "./env.js";

export const DEFAULT_FREE_WEB_TOOL_CREDITS = 1_550;
export const DEFAULT_PRO_WEB_TOOL_CREDITS = 2_000;

export type WebCreditConfig = {
  freeMonthlyCredits: number;
  proMonthlyCredits: number;
};

function parsePositiveInt(
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

export function loadWebCreditConfig(
  source: EnvSource = process.env,
): WebCreditConfig {
  return {
    freeMonthlyCredits: parsePositiveInt(
      getOptionalEnv("FREE_WEB_TOOL_CREDITS", source),
      DEFAULT_FREE_WEB_TOOL_CREDITS,
      "FREE_WEB_TOOL_CREDITS",
    ),
    proMonthlyCredits: parsePositiveInt(
      getOptionalEnv("PRO_WEB_TOOL_CREDITS", source),
      DEFAULT_PRO_WEB_TOOL_CREDITS,
      "PRO_WEB_TOOL_CREDITS",
    ),
  };
}
