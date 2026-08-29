"use client";

import { useQuery } from "@tanstack/react-query";
import { billingApi } from "@/features/billing/api/billing-api";
import { mapUnknownBillingError } from "@/features/billing/api/billing-errors";
import { billingQueryKeys } from "@/features/billing/api/billing-query-keys";
import { isCheckoutActivationPending } from "@/features/billing/lib/checkout-activation";

export function useBillingStatus(options?: { pollWhileConfirming?: boolean }) {
  const query = useQuery({
    queryKey: billingQueryKeys.status(),
    queryFn: () => billingApi.getStatus(),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchInterval: (current) => {
      if (!options?.pollWhileConfirming) {
        return false;
      }

      const billing = current.state.data?.billing;
      return billing === undefined || isCheckoutActivationPending(billing)
        ? 2_000
        : false;
    },
  });

  return {
    billing: query.data?.billing,
    isLoading: query.isLoading,
    isError: query.isError,
    errorKey: query.error === null ? null : mapUnknownBillingError(query.error),
    refetch: query.refetch,
  };
}
