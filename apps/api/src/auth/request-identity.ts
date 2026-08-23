import {
  type Auth,
  type AuthIdentity,
  getAuth,
  getAuthSession,
  toSessionAuthIdentity,
} from "@repo/auth";
import { APP_ERROR_CODES, AppError } from "@repo/core";

export type AnonymousRequestIdentity = {
  kind: "anonymous";
};

export type RequestIdentity = AnonymousRequestIdentity | AuthIdentity;

export type ResolveRequestIdentity = (
  headers: Headers,
) => Promise<RequestIdentity>;

export function hasAuthenticationHints(headers: Headers): boolean {
  return headers.has("cookie") || headers.has("authorization");
}

export async function resolveRequestIdentity(
  headers: Headers,
  auth: Auth,
): Promise<RequestIdentity> {
  const session = await getAuthSession(auth, headers);

  if (session !== null) {
    return toSessionAuthIdentity(session);
  }

  return { kind: "anonymous" };
}

export function createSessionIdentityResolver(
  auth: Auth,
): ResolveRequestIdentity {
  return async (headers) => resolveRequestIdentity(headers, auth);
}

export function createDefaultIdentityResolver(): ResolveRequestIdentity {
  return async (headers) => {
    if (!hasAuthenticationHints(headers)) {
      return { kind: "anonymous" };
    }

    return resolveRequestIdentity(headers, getAuth());
  };
}

export function requireAuthenticatedIdentity(
  identity: RequestIdentity,
): AuthIdentity {
  if (identity.kind === "anonymous") {
    throw new AppError({
      code: APP_ERROR_CODES.UNAUTHORIZED,
      message: "Authentication required",
    });
  }

  return identity;
}
