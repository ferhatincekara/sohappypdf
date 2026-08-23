import type { ApiKeyPublicRecord } from "@repo/api-keys";

export const PUBLIC_API_KEY_STATUSES = [
  "active",
  "revoked",
  "expired",
] as const;

export type PublicApiKeyStatus = (typeof PUBLIC_API_KEY_STATUSES)[number];

export type PublicApiKey = {
  id: string;
  name: string;
  keyPrefix: string;
  status: PublicApiKeyStatus;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
};

export function publicApiKeyStatus(
  record: Pick<ApiKeyPublicRecord, "revokedAt" | "expiresAt">,
  now = new Date(),
): PublicApiKeyStatus {
  if (record.revokedAt !== null) {
    return "revoked";
  }

  if (
    record.expiresAt !== null &&
    record.expiresAt.getTime() <= now.getTime()
  ) {
    return "expired";
  }

  return "active";
}

export function toPublicApiKey(
  record: ApiKeyPublicRecord,
  now = new Date(),
): PublicApiKey {
  return {
    id: record.id,
    name: record.name,
    keyPrefix: record.keyPrefix,
    status: publicApiKeyStatus(record, now),
    createdAt: record.createdAt.toISOString(),
    lastUsedAt: record.lastUsedAt?.toISOString() ?? null,
    expiresAt: record.expiresAt?.toISOString() ?? null,
    revokedAt: record.revokedAt?.toISOString() ?? null,
  };
}

export function toCreatedApiKeyResponse(
  created: { apiKey: ApiKeyPublicRecord; secret: string },
  now = new Date(),
) {
  return {
    apiKey: toPublicApiKey(created.apiKey, now),
    secret: created.secret,
  };
}
