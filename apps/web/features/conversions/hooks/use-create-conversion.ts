"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { billingQueryKeys } from "@/features/billing/api/billing-query-keys";
import { conversionApi } from "../api/conversion-api";
import { mapUnknownConversionError } from "../api/conversion-errors";
import { conversionQueryKeys } from "../api/conversion-query-keys";
import type {
  CreateConversionInput,
  PublicConversion,
} from "../types/conversion";

export function useCreateConversion() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: CreateConversionInput) =>
      conversionApi.create({
        ...input,
        idempotencyKey: input.idempotencyKey ?? crypto.randomUUID(),
      }),
    onSuccess(conversion: PublicConversion) {
      queryClient.setQueryData(
        conversionQueryKeys.detail(conversion.id),
        conversion,
      );
      void queryClient.invalidateQueries({
        queryKey: conversionQueryKeys.lists(),
      });
      void queryClient.invalidateQueries({
        queryKey: billingQueryKeys.status(),
      });
    },
  });

  return {
    createConversion: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    errorKey:
      mutation.error === null
        ? null
        : mapUnknownConversionError(mutation.error),
    reset: mutation.reset,
  };
}
