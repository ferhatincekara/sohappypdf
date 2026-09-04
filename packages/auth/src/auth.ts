import { type AuthConfig, httpsApexWwwOrigins } from "@sohappypdf/config";
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
  trustedOrigins?: readonly string[];
  sendVerificationEmail?: SendAuthEmail;
  sendResetPassword?: SendAuthEmail;
  cookiePrefix?: string;
  shareCookiesAcrossSubdomains?: boolean;
};

function uniqueOrigins(origins: readonly string[]): string[] {
  return [...new Set(origins.filter((origin) => origin.length > 0))];
}

function resolveBrowserOrigins(config: AuthConfig): string[] {
  const origins: string[] = [];

  if (config.appUrl !== undefined) {
    origins.push(...httpsApexWwwOrigins(config.appUrl));
  }

  // Cookie-bearing Better Auth POSTs (login, Google) check Origin against
  // this list. Analytics and anonymous-session cookies count as cookies, so
  // the public site must be trusted even when API_CORS_ORIGINS is missing.
  // www and apex are different origins; both must be listed.
  if (config.cookieDomain !== undefined && config.useSecureCookies) {
    origins.push(...httpsApexWwwOrigins(`https://${config.cookieDomain}`));
  }

  return origins;
}

export function createAuth(options: CreateAuthOptions) {
  const sendVerificationEmail =
    options.sendVerificationEmail ?? sendAuthEmailUnimplemented;
  const sendResetPassword =
    options.sendResetPassword ?? sendAuthEmailUnimplemented;
  const shareCookiesAcrossSubdomains =
    options.shareCookiesAcrossSubdomains ??
    options.config.cookieDomain !== undefined;
  const cookieDomain = shareCookiesAcrossSubdomains
    ? options.config.cookieDomain
    : undefined;
  const google = options.config.google;

  return betterAuth({
    database: options.database,
    secret: options.config.secret,
    baseURL: options.config.baseUrl,
    trustedOrigins: uniqueOrigins([
      new URL(options.config.baseUrl).origin,
      ...resolveBrowserOrigins(options.config),
      ...(options.trustedOrigins ?? []),
    ]),
    telemetry: {
      enabled: false,
    },
    ...(google === undefined
      ? {}
      : {
          socialProviders: {
            google: {
              clientId: google.clientId,
              clientSecret: google.clientSecret,
            },
          },
          account: {
            accountLinking: {
              enabled: true,
              trustedProviders: ["google"],
              // Email/password signup does not verify email. Google emails are
              // verified, so same-email sign-in should attach Google to the
              // existing credential account instead of failing the link.
              requireLocalEmailVerified: false,
            },
          },
        }),
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
    user: {
      changeEmail: {
        enabled: true,
        updateEmailWithoutVerification: true,
      },
    },
    session: {
      expiresIn: SESSION_EXPIRES_IN_SECONDS,
      updateAge: SESSION_UPDATE_AGE_SECONDS,
      cookieCache: {
        enabled: false,
      },
    },
    advanced: {
      cookiePrefix: options.cookiePrefix,
      useSecureCookies:
        options.config.useSecureCookies || cookieDomain !== undefined,
      crossSubDomainCookies:
        cookieDomain === undefined
          ? undefined
          : {
              enabled: true,
              domain: cookieDomain,
            },
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: cookieDomain === undefined ? "lax" : "none",
        secure: options.config.useSecureCookies || cookieDomain !== undefined,
        path: "/",
      },
    },
    onAPIError: {
      throw: true,
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
