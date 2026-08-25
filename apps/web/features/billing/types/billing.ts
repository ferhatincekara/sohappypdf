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

export type ApiProductKey = "starter" | "growth" | "scale";

export type CheckoutProductKey =
  | "pro"
  | "api-starter"
  | "api-growth"
  | "api-scale"
  | "api-pack";

export type ApiCreditLedgerEntry = {
  amount: number;
  type: "grant" | "consume" | "refund" | "adjustment";
  toolId: string | null;
  createdAt: string;
};

export type PublicBillingStatus = {
  plan: BillingPlan;
  subscriptionStatus: BillingSubscriptionStatus | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  canUpgrade: boolean;
  canManage: boolean;
  usage: {
    webCreditsUsed: number;
    webCreditsLimit: number;
    webCreditsRemaining: number;
    aiCreditsUsed: number;
    aiCreditsLimit: number;
    aiCreditsRemaining: number;
    conversionsUsed: number;
    conversionsLimit: number;
    storageUsedBytes: number;
    storageLimitBytes: number;
    apiKeyCount: number;
    apiKeyLimit: number;
    periodStart: string;
    periodEnd: string;
  };
  api: {
    product: ApiProductKey | null;
    subscriptionStatus: BillingSubscriptionStatus | null;
    creditsUsed: number;
    creditsLimit: number;
    creditsRemaining: number;
    recentUsage: readonly ApiCreditLedgerEntry[];
    canSubscribe: boolean;
    canTopUp: boolean;
    availableProducts: readonly CheckoutProductKey[];
    periodStart: string;
    periodEnd: string;
  };
  limits: {
    maxFileSizeBytes: number;
    apiAccess: boolean;
    apiRequestsPerMinute: number;
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
