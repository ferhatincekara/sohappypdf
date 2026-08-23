import { APP_ERROR_CODES, AppError } from "@repo/core";
import { type EnvSource, getOptionalEnv } from "./env.js";

export const POLAR_SERVERS = ["sandbox", "production"] as const;

export type PolarServer = (typeof POLAR_SERVERS)[number];

export type PolarConfig = {
  accessToken: string | undefined;
  webhookSecret: string | undefined;
  proProductId: string | undefined;
  server: PolarServer;
};

export type BillingConfig = {
  polar: PolarConfig;
  successPath: string;
  appUrl: string;
};

export const DEFAULT_BILLING_SUCCESS_PATH = "/app/settings/billing";

function parsePolarServer(value: string | undefined): PolarServer {
  if (value === undefined || value.trim() === "") {
    return "sandbox";
  }

  if (value === "sandbox" || value === "production") {
    return value;
  }

  throw new AppError({
    code: APP_ERROR_CODES.CONFIGURATION_ERROR,
    message: "Invalid POLAR_SERVER",
  });
}

function loadAppUrl(source: EnvSource): string {
  return (
    getOptionalEnv("APP_URL", source) ??
    getOptionalEnv("NEXT_PUBLIC_APP_URL", source) ??
    getOptionalEnv("BETTER_AUTH_URL", source) ??
    "http://localhost:3000"
  );
}

export function loadBillingConfig(
  source: EnvSource = process.env,
): BillingConfig {
  return {
    polar: {
      accessToken: getOptionalEnv("POLAR_ACCESS_TOKEN", source),
      webhookSecret: getOptionalEnv("POLAR_WEBHOOK_SECRET", source),
      proProductId: getOptionalEnv("POLAR_PRO_PRODUCT_ID", source),
      server: parsePolarServer(getOptionalEnv("POLAR_SERVER", source)),
    },
    successPath: DEFAULT_BILLING_SUCCESS_PATH,
    appUrl: loadAppUrl(source).replace(/\/$/, ""),
  };
}

export function assertPolarCheckoutConfig(config: PolarConfig): {
  accessToken: string;
  proProductId: string;
  server: PolarServer;
} {
  if (
    config.accessToken === undefined ||
    config.proProductId === undefined ||
    config.accessToken.length === 0 ||
    config.proProductId.length === 0
  ) {
    throw new AppError({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message: "Polar checkout is not configured",
    });
  }

  return {
    accessToken: config.accessToken,
    proProductId: config.proProductId,
    server: config.server,
  };
}

export function assertPolarWebhookSecret(config: PolarConfig): string {
  if (config.webhookSecret === undefined || config.webhookSecret.length === 0) {
    throw new AppError({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message: "Polar webhook secret is not configured",
    });
  }

  return config.webhookSecret;
}
