import type { ApiProductKey } from "@repo/config";
import type { BillingSubscriptionStatus, PlanId } from "./plan-types.js";
import type { CheckoutProductKey } from "./polar-products.js";

export type BillingCustomerRecord = {
  userId: string;
  polarCustomerId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type BillingSubscriptionRecord = {
  id: string;
  userId: string;
  polarSubscriptionId: string;
  polarProductId: string;
  plan: PlanId;
  status: BillingSubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  endedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UsagePeriodRecord = {
  userId: string;
  periodStart: Date;
  periodEnd: Date;
  conversionsUsed: number;
  webCreditsGranted: number;
  webCreditsUsed: number;
  aiCreditsGranted: number;
  aiCreditsUsed: number;
  apiCreditsGranted: number;
  apiCreditsUsed: number;
};

export type WebCreditBalance = {
  webCreditsGranted: number;
  webCreditsUsed: number;
  webCreditsRemaining: number;
};

export type AiCreditBalance = {
  aiCreditsGranted: number;
  aiCreditsUsed: number;
  aiCreditsRemaining: number;
};

export type ApiCreditBalance = {
  apiCreditsGranted: number;
  apiCreditsUsed: number;
  apiCreditsRemaining: number;
};

export type ApiCreditLedgerEntry = {
  amount: number;
  type: "grant" | "consume" | "refund" | "adjustment";
  toolId: string | null;
  createdAt: string;
};

export type { ApiProductKey } from "@repo/config";
export type { CheckoutProductKey } from "./polar-products.js";

export type ApiSubscriptionRecord = {
  id: string;
  userId: string;
  polarSubscriptionId: string;
  polarProductId: string;
  productKey: ApiProductKey;
  status: BillingSubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  endedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicBillingStatus = {
  plan: PlanId;
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
  };
};

export type PolarCustomer = {
  id: string;
};

export type PolarCheckout = {
  url: string;
};

export type PolarCustomerPortal = {
  url: string;
};

export type PolarClient = {
  findCustomerByExternalId: (
    externalId: string,
  ) => Promise<PolarCustomer | null>;
  createCustomer: (input: {
    email: string;
    externalId: string;
  }) => Promise<PolarCustomer>;
  createCheckout: (input: {
    productId: string;
    externalCustomerId: string;
    successUrl: string;
  }) => Promise<PolarCheckout>;
  createCustomerPortal: (input: {
    customerId: string;
  }) => Promise<PolarCustomerPortal>;
  listSubscriptionsByExternalId: (externalId: string) => Promise<unknown[]>;
};

export type PolarWebhookEvent = {
  id: string;
  type: string;
  data: unknown;
};

export type VerifyPolarWebhook = (
  body: string,
  headers: Record<string, string>,
  secret: string,
) => PolarWebhookEvent;
