"use client";

import { useQuery } from "@tanstack/react-query";
import { billingApi } from "../api/billing-api";
import { mapUnknownBillingError } from "../api/billing-errors";
import { billingQueryKeys } from "../api/billing-query-keys";

export function useBillingStatus(options?: { pollWhileFree?: boolean }) {
  const query = useQuery({
    queryKey: billingQueryKeys.status(),
    queryFn: () => billingApi.getStatus(),
    refetchInterval: (current) => {
      if (!options?.pollWhileFree) {
        return false;
      }

      return current.state.data?.billing.plan === "free" ? 2_000 : false;
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
