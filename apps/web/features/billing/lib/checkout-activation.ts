import type { PublicBillingStatus } from "../types/billing";

export function isCheckoutActivationPending(
  billing: Pick<PublicBillingStatus, "plan" | "subscriptionStatus">,
): boolean {
  return billing.plan === "free" && billing.subscriptionStatus === null;
}
