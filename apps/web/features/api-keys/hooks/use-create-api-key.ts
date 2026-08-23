"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiKeyApi } from "../api/api-key-api";
import { mapUnknownApiKeyError } from "../api/api-key-errors";
import { apiKeysQueryKeys } from "../api/api-key-query-keys";
import type { CreateApiKeyInput } from "../types/api-key";

export function useCreateApiKey() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: CreateApiKeyInput) => apiKeyApi.create(input),
    onSuccess() {
      void queryClient.invalidateQueries({
        queryKey: apiKeysQueryKeys.lists(),
      });
    },
  });

  return {
    createApiKey: mutation.mutateAsync,
    isPending: mutation.isPending,
    errorKey:
      mutation.error === null ? null : mapUnknownApiKeyError(mutation.error),
    reset: mutation.reset,
  };
}
