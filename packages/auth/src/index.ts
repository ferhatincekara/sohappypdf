import { assertServerOnly } from "@sohappypdf/core";

assertServerOnly("@sohappypdf/auth");

export {
  ANONYMOUS_SESSION_COOKIE_NAME,
  createAnonymousSessionCookieClearOptions,
  createAnonymousSessionCookieOptions,
} from "./anonymous-session-cookie.js";
export { createMemoryAnonymousSessionRepository } from "./anonymous-session-memory.js";
export { createAnonymousSessionRepository } from "./anonymous-session-repository.js";
export { createAnonymousSessionService } from "./anonymous-session-service.js";
export { getAnonymousSessionService } from "./anonymous-session-service-factory.js";
export {
  ANONYMOUS_SESSION_TOKEN_PREFIX,
  generateAnonymousSessionToken,
  hashAnonymousSessionToken,
  isAnonymousSessionTokenFormat,
} from "./anonymous-session-token.js";
export type {
  AnonymousSession,
  AnonymousSessionRecord,
  AnonymousSessionRepository,
  AnonymousSessionService,
  ResolveAnonymousSessionResult,
} from "./anonymous-session-types.js";
export type { Auth, CreateAuthOptions } from "./auth.js";
export { createAuth } from "./auth.js";
export {
  createAuthAdapterSchema,
  createAuthDrizzleAdapter,
} from "./auth-adapter.js";
export type { SendAuthEmail, SendAuthEmailInput } from "./auth-email.js";
export { sendAuthEmailUnimplemented } from "./auth-email.js";
export { getAuth } from "./auth-factory.js";
export type {
  ApiKeyAuthIdentity,
  AuthIdentity,
  AuthIdentityKind,
  SessionAuthIdentity,
} from "./auth-identity.js";
export {
  AUTH_IDENTITY_KINDS,
  createApiKeyAuthIdentity,
  createSessionAuthIdentity,
  isAuthIdentityKind,
} from "./auth-identity.js";
export type { AuthSession } from "./auth-session.js";
export {
  assertAuthSession,
  getAuthSession,
  requireAuthSession,
  toSessionAuthIdentity,
} from "./auth-session.js";
export { createResendEmailSender } from "./resend-email.js";
export {
  buildResetPasswordEmail,
  createResetPasswordEmailSender,
} from "./reset-password-email.js";
