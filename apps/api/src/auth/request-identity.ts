import { getApiKeyService, isApiKeyFormat } from "@sohappypdf/api-keys";
import {
  type Auth,
  type AuthIdentity,
  assertUserNotSuspended,
  createApiKeyAuthIdentity,
  findUserAccess,
  getAuth,
  getAuthSession,
  type SessionAuthIdentity,
  toSessionAuthIdentity,
} from "@sohappypdf/auth";
import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import { getBearerToken } from "./bearer-token.js";

export type AnonymousRequestIdentity = {
  kind: "anonymous";
  sessionId?: string;
};

export type RequestIdentity = AnonymousRequestIdentity | AuthIdentity;

export type AuthenticateApiKey = (
  rawKey: string,
) => Promise<{ userId: string; apiKeyId: string } | null>;

export type ResolveRequestIdentity = (
  headers: Headers,
) => Promise<RequestIdentity>;

export function hasAuthenticationHints(headers: Headers): boolean {
  return headers.has("cookie") || headers.has("authorization");
}

export async function resolveApiKeyIdentity(
  rawKey: string,
  authenticateApiKey: AuthenticateApiKey,
): Promise<AuthIdentity> {
  const authenticated = await authenticateApiKey(rawKey);

  if (authenticated === null) {
    throw new AppError({
      code: APP_ERROR_CODES.UNAUTHORIZED,
      message: "Authentication required",
    });
  }

  return createApiKeyAuthIdentity(authenticated);
}

export async function resolveRequestIdentity(
  headers: Headers,
  auth: Auth,
  authenticateApiKey: AuthenticateApiKey,
): Promise<RequestIdentity> {
  const bearerToken = getBearerToken(headers);

  if (bearerToken !== undefined && isApiKeyFormat(bearerToken)) {
    return resolveApiKeyIdentity(bearerToken, authenticateApiKey);
  }

  const session = await getAuthSession(auth, headers);

  if (session !== null) {
    const access = await findUserAccess(session.user.id);

    if (access !== undefined) {
      assertUserNotSuspended(access);
    }

    return toSessionAuthIdentity(session);
  }

  return { kind: "anonymous" };
}

export function createSessionIdentityResolver(
  auth: Auth,
  authenticateApiKey: AuthenticateApiKey,
): ResolveRequestIdentity {
  return async (headers) =>
    resolveRequestIdentity(headers, auth, authenticateApiKey);
}

export function createDefaultIdentityResolver(options?: {
  authenticateApiKey?: AuthenticateApiKey;
}): ResolveRequestIdentity {
  const authenticateApiKey =
    options?.authenticateApiKey ??
    ((rawKey) => getApiKeyService().authenticate(rawKey));

  return async (headers) => {
    const bearerToken = getBearerToken(headers);

    if (bearerToken !== undefined && isApiKeyFormat(bearerToken)) {
      return resolveApiKeyIdentity(bearerToken, authenticateApiKey);
    }

    if (!hasAuthenticationHints(headers)) {
      return { kind: "anonymous" };
    }

    return resolveRequestIdentity(headers, getAuth(), authenticateApiKey);
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

export function requireSessionIdentity(
  identity: RequestIdentity,
): SessionAuthIdentity {
  const authenticated = requireAuthenticatedIdentity(identity);

  if (authenticated.kind !== "session") {
    throw new AppError({
      code: APP_ERROR_CODES.FORBIDDEN,
      message: "Session authentication required",
    });
  }

  return authenticated;
}

export function requireAnonymousIdentity(identity: RequestIdentity): {
  kind: "anonymous";
  sessionId: string;
} {
  if (identity.kind !== "anonymous") {
    throw new AppError({
      code: APP_ERROR_CODES.FORBIDDEN,
      message: "Anonymous access only",
    });
  }

  if (identity.sessionId === undefined || identity.sessionId.length === 0) {
    throw new AppError({
      code: APP_ERROR_CODES.UNAUTHORIZED,
      message: "Anonymous session required",
    });
  }

  return {
    kind: "anonymous",
    sessionId: identity.sessionId,
  };
}
