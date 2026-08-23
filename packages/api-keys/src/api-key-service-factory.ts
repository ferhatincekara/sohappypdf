import { getDb } from "@repo/db";
import { createApiKeyRepository } from "./api-key-repository.js";
import { type ApiKeyService, createApiKeyService } from "./api-key-service.js";

let apiKeyService: ApiKeyService | undefined;

export function getApiKeyService(): ApiKeyService {
  if (apiKeyService === undefined) {
    apiKeyService = createApiKeyService({
      repository: createApiKeyRepository(getDb()),
    });
  }

  return apiKeyService;
}
