export const PLANS = ["free", "pro"] as const;

export type PlanId = (typeof PLANS)[number];

export const BILLING_SUBSCRIPTION_STATUSES = [
  "incomplete",
  "incomplete_expired",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "revoked",
  "paused",
] as const;

export type BillingSubscriptionStatus =
  (typeof BILLING_SUBSCRIPTION_STATUSES)[number];

export type PlanLimits = {
  monthlyConversions: number;
  storageBytes: number;
  maxFileSizeBytes: number;
  maxApiKeys: number;
  apiAccess: boolean;
  authenticatedRequestsPerMinute: number;
  apiRequestsPerMinute: number;
};

export type PlanCatalog = Record<PlanId, PlanLimits>;

export type UserEntitlements = {
  plan: PlanId;
  limits: PlanLimits;
  subscriptionStatus: BillingSubscriptionStatus | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
};

export function isPlanId(value: string): value is PlanId {
  return PLANS.some((plan) => plan === value);
}
