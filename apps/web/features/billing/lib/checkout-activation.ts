import { INCLUDED_API_CREDITS_PER_MONTH } from "@sohappypdf/billing/plans";
import type { PublicBillingStatus } from "@/features/billing/types/billing";

export const CHECKOUT_ACTIVATION_WAIT_MS = 20_000;

export const CHECKOUT_RETURN_PHASES = [
  "idle",
  "confirming",
  "unconfirmed",
] as const;

export type CheckoutReturnPhase = (typeof CHECKOUT_RETURN_PHASES)[number];

export type CheckoutBanner = "confirming" | "unconfirmed" | null;

export function isCheckoutActivationPending(
  billing: Pick<PublicBillingStatus, "plan" | "subscriptionStatus"> & {
    api: Pick<PublicBillingStatus["api"], "product" | "creditsLimit">;
  },
): boolean {
  const webPending =
    billing.plan === "free" && billing.subscriptionStatus === null;
  const apiPending =
    billing.api.product === null &&
    billing.api.creditsLimit <= INCLUDED_API_CREDITS_PER_MONTH;

  return webPending && apiPending;
}

export function resolveCheckoutBanner(input: {
  phase: CheckoutReturnPhase;
  pending: boolean;
}): CheckoutBanner {
  if (!input.pending) {
    return null;
  }

  if (input.phase === "confirming") {
    return "confirming";
  }

  if (input.phase === "unconfirmed") {
    return "unconfirmed";
  }

  return null;
}
