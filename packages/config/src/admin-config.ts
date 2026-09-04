import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import { type EnvSource, getOptionalEnv } from "./env.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BETTER_AUTH_USER_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

export type AdminConfig = {
  adminUrl?: string;
  bootstrapUserIds: readonly string[];
  workerHealthUrl?: string;
};

function parseOptionalOrigin(
  value: string | undefined,
  name: string,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new AppError({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message: `Invalid ${name}`,
    });
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new AppError({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message: `Invalid ${name}`,
    });
  }

  return parsed.origin;
}

function parseBootstrapUserIds(value: string | undefined): readonly string[] {
  if (value === undefined) {
    return [];
  }

  const ids: string[] = [];

  for (const part of value.split(",")) {
    const id = part.trim();

    if (id.length === 0) {
      continue;
    }

    if (!UUID_PATTERN.test(id) && !BETTER_AUTH_USER_ID_PATTERN.test(id)) {
      throw new AppError({
        code: APP_ERROR_CODES.CONFIGURATION_ERROR,
        message: "Invalid ADMIN_USER_IDS",
      });
    }

    if (!ids.includes(id)) {
      ids.push(id);
    }
  }

  return ids;
}

export function loadAdminConfig(source: EnvSource = process.env): AdminConfig {
  return {
    adminUrl: parseOptionalOrigin(
      getOptionalEnv("ADMIN_URL", source) ??
        getOptionalEnv("NEXT_PUBLIC_ADMIN_URL", source),
      "ADMIN_URL",
    ),
    bootstrapUserIds: parseBootstrapUserIds(
      getOptionalEnv("ADMIN_USER_IDS", source),
    ),
    workerHealthUrl: parseOptionalOrigin(
      getOptionalEnv("WORKER_HEALTH_URL", source),
      "WORKER_HEALTH_URL",
    ),
  };
}
