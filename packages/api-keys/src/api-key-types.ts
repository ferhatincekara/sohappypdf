export type ApiKeyPublicRecord = {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
};

export type StoredApiKeyRecord = ApiKeyPublicRecord & {
  keyHash: string;
};

export type CreatedApiKey = {
  apiKey: ApiKeyPublicRecord;
  secret: string;
};

export type CreateApiKeyInput = {
  userId: string;
  name: string;
  expiresAt?: Date;
};

export type DeleteApiKeyInput = {
  id: string;
  userId: string;
};

export type AuthenticatedApiKey = {
  userId: string;
  apiKeyId: string;
};
