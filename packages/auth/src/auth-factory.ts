import {
  loadApiConfig,
  loadAuthConfig,
  loadEmailConfig,
} from "@sohappypdf/config";
import { getDb } from "@sohappypdf/db";
import { createLogger } from "@sohappypdf/logger";
import { type Auth, createAuth } from "./auth.js";
import { createAuthDrizzleAdapter } from "./auth-adapter.js";
import { createResendEmailSender } from "./resend-email.js";
import { createResetPasswordEmailSender } from "./reset-password-email.js";

let auth: Auth | undefined;

export function getAuth(): Auth {
  if (auth === undefined) {
    const email = loadEmailConfig();
    const logger = createLogger({ name: "auth" });

    auth = createAuth({
      config: loadAuthConfig(),
      database: createAuthDrizzleAdapter(getDb()),
      trustedOrigins: loadApiConfig().corsOrigins,
      sendResetPassword: createResetPasswordEmailSender({
        sendEmail:
          email.resendApiKey === undefined
            ? undefined
            : createResendEmailSender({
                apiKey: email.resendApiKey,
                fromEmail: email.fromEmail,
              }),
        logger,
      }),
    });
  }

  return auth;
}
