import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import type { Logger } from "@sohappypdf/logger";
import type { SendAuthEmail, SendAuthEmailInput } from "./auth-email.js";
import {
  renderResetPasswordEmailHtml,
  renderResetPasswordEmailText,
} from "./reset-password-email-template.js";

export type AuthEmailMessage = {
  subject: string;
  text: string;
  html: string;
};

export type SendTransactionalEmail = (input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) => Promise<void>;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function requireHttpResetUrl(url: string): string {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    throw new AppError({
      code: APP_ERROR_CODES.INTERNAL_ERROR,
      message: "Invalid password reset URL",
    });
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new AppError({
      code: APP_ERROR_CODES.INTERNAL_ERROR,
      message: "Invalid password reset URL",
    });
  }

  return parsed.toString();
}

export function buildResetPasswordEmail(url: string): AuthEmailMessage {
  const resetUrl = requireHttpResetUrl(url);
  const homeUrl = escapeHtml(new URL(resetUrl).origin);

  return {
    subject: "Reset your SoHappyPDF password",
    text: renderResetPasswordEmailText({ resetUrl }),
    html: renderResetPasswordEmailHtml({
      resetUrl: escapeHtml(resetUrl),
      homeUrl,
    }),
  };
}

export function createResetPasswordEmailSender(options: {
  sendEmail?: SendTransactionalEmail;
  logger?: Logger;
}): SendAuthEmail {
  const sendEmail = options.sendEmail;
  const logger = options.logger;

  return async (data: SendAuthEmailInput) => {
    if (sendEmail === undefined) {
      logger?.warn(
        "Password reset email was not sent because Resend is not configured",
      );
      return;
    }

    const message = buildResetPasswordEmail(data.url);

    try {
      await sendEmail({
        to: data.user.email,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });
    } catch {
      logger?.error("Failed to send password reset email");
    }
  };
}
