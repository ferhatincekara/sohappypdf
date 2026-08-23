import type { AuthConfig } from "@repo/config";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import {
  type SendAuthEmail,
  sendAuthEmailUnimplemented,
} from "./auth-email.js";

const SESSION_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7;
const SESSION_UPDATE_AGE_SECONDS = 60 * 60 * 24;

export type CreateAuthOptions = {
  config: AuthConfig;
  database: NonNullable<BetterAuthOptions["database"]>;
  sendVerificationEmail?: SendAuthEmail;
  sendResetPassword?: SendAuthEmail;
};

export function createAuth(options: CreateAuthOptions) {
  const sendVerificationEmail =
    options.sendVerificationEmail ?? sendAuthEmailUnimplemented;
  const sendResetPassword =
    options.sendResetPassword ?? sendAuthEmailUnimplemented;

  return betterAuth({
    database: options.database,
    secret: options.config.secret,
    baseURL: options.config.baseUrl,
    trustedOrigins: [new URL(options.config.baseUrl).origin],
    telemetry: {
      enabled: false,
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      requireEmailVerification: false,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword,
    },
    emailVerification: {
      sendVerificationEmail,
    },
    session: {
      expiresIn: SESSION_EXPIRES_IN_SECONDS,
      updateAge: SESSION_UPDATE_AGE_SECONDS,
      cookieCache: {
        enabled: false,
      },
    },
    advanced: {
      useSecureCookies: options.config.useSecureCookies,
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: options.config.useSecureCookies,
        path: "/",
      },
      database: {
        joins: true,
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
