import type { AxiosInstance } from "axios";
import { toApiKeyClientError } from "@/features/api-keys/api/api-key-errors";
import type {
  ApiKeyListResponse,
  CreateApiKeyInput,
  CreateApiKeyResponse,
  PublicApiKey,
} from "@/features/api-keys/types/api-key";
import { apiClient } from "@/lib/api/client";

export class ApiKeyApiRequestError extends Error {
  readonly clientError: ReturnType<typeof toApiKeyClientError>;

  constructor(error: unknown) {
    super("API key request failed");
    this.name = "ApiKeyApiRequestError";
    this.clientError = toApiKeyClientError(error);
  }
}

export type ApiKeyApi = {
  list: () => Promise<ApiKeyListResponse>;
  create: (input: CreateApiKeyInput) => Promise<CreateApiKeyResponse>;
  revoke: (id: string) => Promise<PublicApiKey>;
};

export function createApiKeyApi(client: AxiosInstance = apiClient): ApiKeyApi {
  return {
    async list() {
      try {
        const response = await client.get<ApiKeyListResponse>("/v1/api-keys");
        return response.data;
      } catch (error) {
        throw new ApiKeyApiRequestError(error);
      }
    },

    async create(input) {
      try {
        const response = await client.post<CreateApiKeyResponse>(
          "/v1/api-keys",
          { name: input.name },
        );
        return response.data;
      } catch (error) {
        throw new ApiKeyApiRequestError(error);
      }
    },

    async revoke(id) {
      try {
        const response = await client.delete<{ apiKey: PublicApiKey }>(
          `/v1/api-keys/${id}`,
        );
        return response.data.apiKey;
      } catch (error) {
        throw new ApiKeyApiRequestError(error);
      }
    },
  };
}

export const apiKeyApi = createApiKeyApi();
