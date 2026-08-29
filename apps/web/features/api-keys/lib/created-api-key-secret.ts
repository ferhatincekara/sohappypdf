import type {
  CreateApiKeyResponse,
  PublicApiKey,
} from "@/features/api-keys/types/api-key";

export type CreatedApiKeySecret = {
  name: string;
  secret: string;
};

export function takeCreatedApiKeySecret(
  created: CreateApiKeyResponse,
): CreatedApiKeySecret {
  return {
    name: created.apiKey.name,
    secret: created.secret,
  };
}

export function toListCacheApiKey(created: CreateApiKeyResponse): PublicApiKey {
  return created.apiKey;
}

export function createdSecretPersistedInCache(value: unknown): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return "secret" in value;
}
