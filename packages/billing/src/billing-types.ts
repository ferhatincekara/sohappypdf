import type { BillingSubscriptionStatus, PlanId } from "./plan-types.js";

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
};

export type PublicBillingStatus = {
  plan: PlanId;
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
