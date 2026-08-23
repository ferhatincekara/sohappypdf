export const BILLING_PLANS = ["free", "pro"] as const;

export type BillingPlan = (typeof BILLING_PLANS)[number];

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

export type PublicBillingStatus = {
  plan: BillingPlan;
  subscriptionStatus: BillingSubscriptionStatus | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  canUpgrade: boolean;
  canManage: boolean;
  usage: {
    conversionsUsed: number;
    conversionsLimit: number;
    storageUsedBytes: number;
    storageLimitBytes: number;
    apiKeyCount: number;
    apiKeyLimit: number;
    periodStart: string;
    periodEnd: string;
  };
  limits: {
    maxFileSizeBytes: number;
    apiAccess: boolean;
  };
};

export type BillingStatusResponse = {
  billing: PublicBillingStatus;
};

export type BillingCheckoutResponse = {
  checkout: {
    url: string;
  };
};

export type BillingPortalResponse = {
  portal: {
    url: string;
  };
};
