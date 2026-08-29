import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import { type EnvSource, getOptionalEnv } from "./env.js";

export const DEFAULT_RESEND_FROM_EMAIL = "SoHappyPDF <noreply@sohappypdf.com>";

export type EmailConfig = {
  resendApiKey: string | undefined;
  fromEmail: string;
};

function parseFromEmail(value: string | undefined): string {
  const fromEmail = value ?? DEFAULT_RESEND_FROM_EMAIL;

  if (!fromEmail.includes("@")) {
    throw new AppError({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message: "Invalid RESEND_FROM_EMAIL",
    });
  }

  return fromEmail;
}

export function loadEmailConfig(source: EnvSource = process.env): EmailConfig {
  return {
    resendApiKey: getOptionalEnv("RESEND_API_KEY", source),
    fromEmail: parseFromEmail(getOptionalEnv("RESEND_FROM_EMAIL", source)),
  };
}
