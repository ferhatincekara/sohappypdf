"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiKeyApi } from "@/features/api-keys/api/api-key-api";
import { mapUnknownApiKeyError } from "@/features/api-keys/api/api-key-errors";
import { apiKeysQueryKeys } from "@/features/api-keys/api/api-key-query-keys";

export function useRevokeApiKey() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: string) => apiKeyApi.revoke(id),
    onSuccess() {
      void queryClient.invalidateQueries({
        queryKey: apiKeysQueryKeys.lists(),
      });
    },
  });

  return {
    revokeApiKey: mutation.mutateAsync,
    isPending: mutation.isPending,
    errorKey:
      mutation.error === null ? null : mapUnknownApiKeyError(mutation.error),
    reset: mutation.reset,
  };
}
