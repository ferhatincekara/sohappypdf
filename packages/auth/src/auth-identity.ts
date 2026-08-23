export const AUTH_IDENTITY_KINDS = ["session", "api-key"] as const;

export type AuthIdentityKind = (typeof AUTH_IDENTITY_KINDS)[number];

export type SessionAuthIdentity = {
  kind: "session";
  userId: string;
  sessionId: string;
};

export type ApiKeyAuthIdentity = {
  kind: "api-key";
  userId: string;
  apiKeyId: string;
};

export type AuthIdentity = SessionAuthIdentity | ApiKeyAuthIdentity;

export function isAuthIdentityKind(value: string): value is AuthIdentityKind {
  for (const kind of AUTH_IDENTITY_KINDS) {
    if (kind === value) {
      return true;
    }
  }

  return false;
}

export function createSessionAuthIdentity(input: {
  userId: string;
  sessionId: string;
}): SessionAuthIdentity {
  return {
    kind: "session",
    userId: input.userId,
    sessionId: input.sessionId,
  };
}
