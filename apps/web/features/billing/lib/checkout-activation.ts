import type { PublicBillingStatus } from "../types/billing";

export function isCheckoutActivationPending(
  billing: Pick<PublicBillingStatus, "plan" | "subscriptionStatus"> & {
    api: Pick<PublicBillingStatus["api"], "product" | "creditsLimit">;
  },
): boolean {
  const webPending =
    billing.plan === "free" && billing.subscriptionStatus === null;
  const apiPending =
    billing.api.product === null && billing.api.creditsLimit === 0;

  return webPending && apiPending;
}
