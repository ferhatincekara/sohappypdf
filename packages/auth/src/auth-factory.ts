import {
  loadApiConfig,
  loadAuthConfig,
  loadEmailConfig,
} from "@sohappypdf/config";
import { getDb } from "@sohappypdf/db";
import { createLogger } from "@sohappypdf/logger";
import { createAccountSuspendedApiError } from "./account-suspended.js";
import {
  ADMIN_AUTH_COOKIE_PREFIX,
  isAdminAuthSurface,
} from "./admin-auth-surface.js";
import { findUserAccess } from "./admin-authorization.js";
import { type Auth, createAuth } from "./auth.js";
import { createAuthDrizzleAdapter } from "./auth-adapter.js";
import { createResendEmailSender } from "./resend-email.js";
import { createResetPasswordEmailSender } from "./reset-password-email.js";

let webAuth: Auth | undefined;
let adminAuth: Auth | undefined;

async function rejectSuspendedSessionUser(userId: string): Promise<void> {
  const access = await findUserAccess(userId);

  if (access !== undefined && access.suspendedAt !== null) {
    throw createAccountSuspendedApiError();
  }
}

function createSharedAuthOptions() {
  const email = loadEmailConfig();
  const logger = createLogger({ name: "auth" });

  return {
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
    assertSessionUser: rejectSuspendedSessionUser,
  };
}

export function getAuth(): Auth {
  if (webAuth === undefined) {
    webAuth = createAuth(createSharedAuthOptions());
  }

  return webAuth;
}

export function getAdminAuth(): Auth {
  if (adminAuth === undefined) {
    adminAuth = createAuth({
      ...createSharedAuthOptions(),
      cookiePrefix: ADMIN_AUTH_COOKIE_PREFIX,
      shareCookiesAcrossSubdomains: false,
    });
  }

  return adminAuth;
}

export function handleAuthRequest(
  request: Request,
): Promise<Response> | Response {
  const auth = isAdminAuthSurface(request.headers) ? getAdminAuth() : getAuth();

  return auth.handler(request);
}
