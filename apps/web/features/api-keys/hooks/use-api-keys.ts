"use client";

import { useQuery } from "@tanstack/react-query";
import { apiKeyApi } from "../api/api-key-api";
import { mapUnknownApiKeyError } from "../api/api-key-errors";
import { apiKeysQueryKeys } from "../api/api-key-query-keys";

export function useApiKeys() {
  const query = useQuery({
    queryKey: apiKeysQueryKeys.list(),
    queryFn: () => apiKeyApi.list(),
  });

  return {
    apiKeys: query.data?.apiKeys ?? [],
    isLoading: query.isPending,
    isError: query.isError,
    errorKey: query.error === null ? null : mapUnknownApiKeyError(query.error),
    refetch: query.refetch,
  };
}
