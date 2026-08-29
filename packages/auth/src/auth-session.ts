import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import type { Auth } from "./auth.js";
import type { SessionAuthIdentity } from "./auth-identity.js";
import { createSessionAuthIdentity } from "./auth-identity.js";

export type AuthSession = NonNullable<
  Awaited<ReturnType<Auth["api"]["getSession"]>>
>;

export function assertAuthSession(session: AuthSession | null): AuthSession {
  if (session === null) {
    throw new AppError({
      code: APP_ERROR_CODES.UNAUTHORIZED,
      message: "Authentication required",
    });
  }

  return session;
}

export function toSessionAuthIdentity(
  session: AuthSession,
): SessionAuthIdentity {
  return createSessionAuthIdentity({
    userId: session.user.id,
    sessionId: session.session.id,
  });
}

export async function getAuthSession(
  auth: Auth,
  headers: Headers,
): Promise<AuthSession | null> {
  return auth.api.getSession({ headers });
}

export async function requireAuthSession(
  auth: Auth,
  headers: Headers,
): Promise<AuthSession> {
  return assertAuthSession(await getAuthSession(auth, headers));
}
