"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { billingApi } from "@/features/billing/api/billing-api";
import { mapUnknownBillingError } from "@/features/billing/api/billing-errors";
import { billingQueryKeys } from "@/features/billing/api/billing-query-keys";
import type {
  BillingInterval,
  CheckoutProductKey,
} from "@/features/billing/types/billing";

export type BillingCheckoutInput = {
  product?: CheckoutProductKey;
  interval?: BillingInterval;
};

export function useBillingActions() {
  const tErrors = useTranslations("billing.errors");
  const queryClient = useQueryClient();
  const checkout = useMutation({
    mutationFn: ({
      product = "pro",
      interval = "monthly",
    }: BillingCheckoutInput = {}) =>
      billingApi.createCheckout(product, interval),
    onSuccess(result) {
      if (result.checkout.url === null) {
        void queryClient.invalidateQueries({
          queryKey: billingQueryKeys.status(),
        });
        return;
      }

      window.location.assign(result.checkout.url);
    },
    onError(error) {
      toast.error(tErrors(mapUnknownBillingError(error)));
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
    onError(error) {
      toast.error(tErrors(mapUnknownBillingError(error)));
    },
  });

  return {
    startCheckout: checkout.mutate,
    openPortal: portal.mutate,
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
