import { assertServerOnly } from "@sohappypdf/core";

assertServerOnly("@sohappypdf/api-keys");

export {
  API_KEY_LAST_USED_UPDATE_INTERVAL_MS,
  shouldUpdateLastUsedAt,
} from "./api-key-last-used.js";
export type { ApiKeyRepository } from "./api-key-repository.js";
export { createApiKeyRepository } from "./api-key-repository.js";
export {
  API_KEY_LOOKUP_LENGTH,
  API_KEY_PRODUCT_PREFIX,
  API_KEY_SECRET_BYTES,
  apiKeyHashesEqual,
  extractApiKeyPrefix,
  generateApiKeySecret,
  hashApiKey,
  isApiKeyFormat,
} from "./api-key-secret.js";
export type { ApiKeyService, ApiKeyServiceOptions } from "./api-key-service.js";
export {
  createApiKeyService,
  toApiKeyPublicRecord,
} from "./api-key-service.js";
export { getApiKeyService } from "./api-key-service-factory.js";
export type {
  ApiKeyPublicRecord,
  AuthenticatedApiKey,
  CreateApiKeyInput,
  CreatedApiKey,
  DeleteApiKeyInput,
  StoredApiKeyRecord,
} from "./api-key-types.js";
