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
  | "api-scale";

export const BILLING_INTERVALS = ["monthly", "yearly"] as const;

export type BillingInterval = (typeof BILLING_INTERVALS)[number];

export type ApiCreditLedgerKind =
  | "reset"
  | "pack"
  | "grant"
  | "consume"
  | "refund";

export type ApiCreditLedgerEntry = {
  id: string;
  amount: number;
  type: "grant" | "consume" | "refund" | "adjustment";
  kind: ApiCreditLedgerKind;
  toolId: string | null;
  createdAt: string;
};

export type CatalogOfferPrice = {
  monthlyUsd: number;
  yearlyUsd: number | null;
};

export type BillingCatalogPrices = {
  pro: CatalogOfferPrice;
  starter: CatalogOfferPrice;
  growth: CatalogOfferPrice;
  scale: CatalogOfferPrice;
};

export type PublicBillingStatus = {
  plan: BillingPlan;
  subscriptionStatus: BillingSubscriptionStatus | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  canUpgrade: boolean;
  canManage: boolean;
  interval: BillingInterval | null;
  usage: {
    webCreditsUsed: number;
    webCreditsLimit: number;
    webCreditsRemaining: number;
    aiCreditsUsed: number;
    aiCreditsLimit: number;
    aiCreditsRemaining: number;
    conversionsUsed: number;
    conversionsLimit: number | null;
    storageUsedBytes: number;
    storageLimitBytes: number;
    apiKeyCount: number;
    apiKeyLimit: number;
    periodStart: string;
    periodEnd: string;
  };
  api: {
    product: ApiProductKey | null;
    interval: BillingInterval | null;
    subscriptionStatus: BillingSubscriptionStatus | null;
    creditsUsed: number;
    creditsLimit: number;
    creditsRemaining: number;
    recentUsage: readonly ApiCreditLedgerEntry[];
    canSubscribe: boolean;
    availableProducts: readonly CheckoutProductKey[];
    periodStart: string;
    periodEnd: string;
  };
  limits: {
    maxFileSizeBytes: number;
    maxFilesPerOperation: number | null;
    maxPagesPerFile: number | null;
    apiAccess: boolean;
    apiRequestsPerMinute: number;
  };
  prices: BillingCatalogPrices;
};

export type BillingStatusResponse = {
  billing: PublicBillingStatus;
};

export type BillingCheckoutResponse = {
  checkout: {
    url: string | null;
  };
};

export type BillingPortalResponse = {
  portal: {
    url: string;
  };
};
