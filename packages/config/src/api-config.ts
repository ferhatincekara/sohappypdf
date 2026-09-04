import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import { type EnvSource, getOptionalEnv } from "./env.js";
import { expandHttpsSiteOrigins } from "./site-origins.js";

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

function parseOptionalOrigin(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  try {
    const parsed = new URL(value);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return undefined;
    }

    return parsed.origin;
  } catch {
    return undefined;
  }
}

export function loadApiConfig(source: EnvSource = process.env): ApiConfig {
  const configured = parseCorsOrigins(
    getOptionalEnv("API_CORS_ORIGINS", source),
  );
  const appOrigin = parseOptionalOrigin(
    getOptionalEnv("APP_URL", source) ??
      getOptionalEnv("NEXT_PUBLIC_APP_URL", source),
  );
  const adminOrigin = parseOptionalOrigin(
    getOptionalEnv("ADMIN_URL", source) ??
      getOptionalEnv("NEXT_PUBLIC_ADMIN_URL", source),
  );

  return {
    corsOrigins: expandHttpsSiteOrigins([
      ...configured,
      ...(appOrigin === undefined ? [] : [appOrigin]),
      ...(adminOrigin === undefined ? [] : [adminOrigin]),
    ]),
  };
}
