import type { ApiProductKey } from "@sohappypdf/config";
import type { BillingCatalogPrices } from "./default-plan-limits.js";
import type { BillingSubscriptionStatus, PlanId } from "./plan-types.js";
import type { CheckoutProductKey } from "./polar-products.js";

export type {
  BillingCatalogPrices,
  CatalogOfferPrice,
} from "./default-plan-limits.js";

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

export type { ApiProductKey } from "@sohappypdf/config";
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
    productIds: readonly string[];
    externalCustomerId: string;
    customerEmail: string;
    successUrl: string;
    returnUrl?: string;
  }) => Promise<PolarCheckout>;
  updateSubscription: (input: {
    subscriptionId: string;
    productId: string;
  }) => Promise<void>;
  createCustomerPortal: (input: {
    externalCustomerId: string;
    customerId?: string;
    returnUrl?: string;
  }) => Promise<PolarCustomerPortal>;
  listSubscriptionsByExternalId: (externalId: string) => Promise<unknown[]>;
  listSubscriptionsByCustomerId: (customerId: string) => Promise<unknown[]>;
  listSubscriptionsByEmail: (email: string) => Promise<unknown[]>;
  getProduct: (id: string) => Promise<unknown | null>;
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
