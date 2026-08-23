import { assertServerOnly } from "@repo/core";

assertServerOnly("@repo/auth");

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
