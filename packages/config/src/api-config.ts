import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import { type EnvSource, getOptionalEnv } from "./env.js";

export type ApiConfig = {
  corsOrigins: readonly string[];
};

function parseCorsOrigins(value: string | undefined): readonly string[] {
  if (value === undefined) {
    return [];
  }

  const origins: string[] = [];

  for (const part of value.split(",")) {
    const candidate = part.trim();

    if (candidate === "") {
      continue;
    }

    if (candidate === "*") {
      throw new AppError({
        code: APP_ERROR_CODES.CONFIGURATION_ERROR,
        message: "API_CORS_ORIGINS cannot include *",
      });
    }

    let parsed: URL;

    try {
      parsed = new URL(candidate);
    } catch {
      throw new AppError({
        code: APP_ERROR_CODES.CONFIGURATION_ERROR,
        message: "Invalid API_CORS_ORIGINS",
      });
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new AppError({
        code: APP_ERROR_CODES.CONFIGURATION_ERROR,
        message: "Invalid API_CORS_ORIGINS",
      });
    }

    origins.push(parsed.origin);
  }

  return origins;
}

export function loadApiConfig(source: EnvSource = process.env): ApiConfig {
  return {
    corsOrigins: parseCorsOrigins(getOptionalEnv("API_CORS_ORIGINS", source)),
  };
}
