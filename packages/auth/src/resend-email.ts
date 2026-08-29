import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import { Resend } from "resend";
import type { SendTransactionalEmail } from "./reset-password-email.js";

export type ResendEmailClient = {
  emails: {
    send: (input: {
      from: string;
      to: string;
      subject: string;
      text: string;
      html: string;
    }) => Promise<{
      error: { message?: string } | null;
    }>;
  };
};

export function createResendEmailSender(options: {
  apiKey: string;
  fromEmail: string;
  client?: ResendEmailClient;
}): SendTransactionalEmail {
  const client = options.client ?? new Resend(options.apiKey);

  return async (input) => {
    const { error } = await client.emails.send({
      from: options.fromEmail,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });

    if (error !== null) {
      throw new AppError({
        code: APP_ERROR_CODES.INTERNAL_ERROR,
        message: "Failed to send email",
      });
    }
  };
}
