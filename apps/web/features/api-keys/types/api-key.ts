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

export type ApiKeyListResponse = {
  apiKeys: PublicApiKey[];
};

export type CreateApiKeyInput = {
  name: string;
};

export type CreateApiKeyResponse = {
  apiKey: PublicApiKey;
  secret: string;
};

export type DeleteApiKeyResponse = {
  apiKey: PublicApiKey;
};
