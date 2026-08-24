import { APP_ERROR_CODES, AppError } from "@repo/core";
import { type EnvSource, getOptionalEnv } from "./env.js";

export const DEFAULT_FREE_AI_CREDITS = 0;
export const DEFAULT_PRO_AI_CREDITS = 200;
export const DEFAULT_AI_MAX_PAGES = 50;
export const DEFAULT_AI_MAX_EXTRACTED_CHARS = 100_000;
export const DEFAULT_AI_MAX_REQUEST_CHARS = 100_000;

export type AiProviderKind = "stub" | "mock";

export type AiConfig = {
  provider: AiProviderKind;
  freeMonthlyCredits: number;
  proMonthlyCredits: number;
  maxPages: number;
  maxExtractedChars: number;
  maxRequestChars: number;
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

function parsePositiveInt(
  value: string | undefined,
  fallback: number,
  name: string,
): number {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new AppError({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message: `Invalid ${name}`,
    });
  }

  return parsed;
}

function parseProvider(value: string | undefined): AiProviderKind {
  if (value === undefined || value.trim() === "") {
    return "stub";
  }

  if (value === "stub" || value === "mock") {
    return value;
  }

  throw new AppError({
    code: APP_ERROR_CODES.CONFIGURATION_ERROR,
    message: "Invalid AI_PROVIDER",
  });
}

export function loadAiConfig(source: EnvSource = process.env): AiConfig {
  return {
    provider: parseProvider(getOptionalEnv("AI_PROVIDER", source)),
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
    maxPages: parsePositiveInt(
      getOptionalEnv("AI_MAX_PAGES", source),
      DEFAULT_AI_MAX_PAGES,
      "AI_MAX_PAGES",
    ),
    maxExtractedChars: parsePositiveInt(
      getOptionalEnv("AI_MAX_EXTRACTED_CHARS", source),
      DEFAULT_AI_MAX_EXTRACTED_CHARS,
      "AI_MAX_EXTRACTED_CHARS",
    ),
    maxRequestChars: parsePositiveInt(
      getOptionalEnv("AI_MAX_REQUEST_CHARS", source),
      DEFAULT_AI_MAX_REQUEST_CHARS,
      "AI_MAX_REQUEST_CHARS",
    ),
  };
}
