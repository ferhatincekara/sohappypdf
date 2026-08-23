"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { billingApi } from "../api/billing-api";
import { mapUnknownBillingError } from "../api/billing-errors";
import { billingQueryKeys } from "../api/billing-query-keys";

export function useBillingActions() {
  const queryClient = useQueryClient();
  const checkout = useMutation({
    mutationFn: () => billingApi.createCheckout(),
    onSuccess(result) {
      window.location.assign(result.checkout.url);
    },
  });
  const portal = useMutation({
    mutationFn: () => billingApi.createPortal(),
    onSuccess(result) {
      void queryClient.invalidateQueries({
        queryKey: billingQueryKeys.status(),
      });
      window.location.assign(result.portal.url);
    },
  });

  return {
    startCheckout: checkout.mutateAsync,
    openPortal: portal.mutateAsync,
    isCheckoutPending: checkout.isPending,
    isPortalPending: portal.isPending,
    errorKey:
      checkout.error === null && portal.error === null
        ? null
        : mapUnknownBillingError(checkout.error ?? portal.error),
    reset() {
      checkout.reset();
      portal.reset();
    },
  };
}
