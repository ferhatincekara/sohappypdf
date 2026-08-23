import { assertPolarCheckoutConfig, type BillingConfig } from "@repo/config";
import { APP_ERROR_CODES, AppError } from "@repo/core";
import type { BillingRepository } from "./billing-repository.js";
import type {
  PolarClient,
  PublicBillingStatus,
  VerifyPolarWebhook,
} from "./billing-types.js";
import {
  assertCanCreateApiKey,
  assertCanCreateConversion,
  assertCanUploadFile,
  resolvePlan,
} from "./entitlements.js";
import { DEFAULT_PLAN_LIMITS, getPlanLimits } from "./plan-config.js";
import type { PlanCatalog, PlanId, UserEntitlements } from "./plan-types.js";
import { getUtcMonthPeriod } from "./usage-period.js";
import { handlePolarWebhook } from "./webhook-service.js";

export type BillingServiceOptions = {
  repository: BillingRepository;
  config: BillingConfig;
  polarClient?: PolarClient;
  verifyWebhook?: VerifyPolarWebhook;
  planCatalog?: PlanCatalog;
  now?: () => Date;
};

export type BillingService = {
  getEntitlements(userId: string): Promise<UserEntitlements>;
  resolvePlan(userId: string): Promise<PlanId>;
  getConversionUsage(userId: string): Promise<{ conversionsUsed: number }>;
  getBillingStatus(input: {
    userId: string;
    storageUsedBytes: number;
    apiKeyCount: number;
  }): Promise<PublicBillingStatus>;
  assertCanCreateConversion(userId: string): Promise<void>;
  assertCanUploadFile(input: {
    userId: string;
    sizeBytes: number;
    storageUsedBytes: number;
  }): Promise<void>;
  assertCanCreateApiKey(input: { userId: string; used: number }): Promise<void>;
  recordConversionUsage(input: {
    userId: string;
    conversionId: string;
  }): Promise<boolean>;
  createCheckout(userId: string): Promise<{ url: string }>;
  createCustomerPortal(userId: string): Promise<{ url: string }>;
  handleWebhook(input: {
    body: string;
    headers: Record<string, string>;
  }): Promise<{ outcome: "applied" | "duplicate" | "ignored" }>;
};

function checkoutSuccessUrl(config: BillingConfig): string {
  return `${config.appUrl}${config.successPath}?checkout=success`;
}

export function createBillingService(
  options: BillingServiceOptions,
): BillingService {
  const now = options.now ?? (() => new Date());
  const catalog = options.planCatalog ?? DEFAULT_PLAN_LIMITS;

  async function getEntitlements(userId: string): Promise<UserEntitlements> {
    const subscription =
      await options.repository.findLatestSubscriptionByUserId(userId);
    const current = now();
    const plan = resolvePlan(subscription ?? null, current);

    return {
      plan,
      limits: getPlanLimits(catalog, plan),
      subscriptionStatus: subscription?.status ?? null,
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
      currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
    };
  }

  async function ensurePolarCustomer(userId: string) {
    const polar = options.polarClient;

    if (polar === undefined) {
      throw new AppError({
        code: APP_ERROR_CODES.CONFIGURATION_ERROR,
        message: "Polar checkout is not configured",
      });
    }

    const existing = await options.repository.findCustomerByUserId(userId);

    if (existing !== undefined) {
      return existing;
    }

    const remote = await polar.findCustomerByExternalId(userId);
    const polarCustomer =
      remote ??
      (await polar.createCustomer({
        email: await requireUserEmail(userId),
        externalId: userId,
      }));

    return options.repository.upsertCustomer({
      userId,
      polarCustomerId: polarCustomer.id,
      createdAt: now(),
      updatedAt: now(),
    });
  }

  async function requireUserEmail(userId: string): Promise<string> {
    const email = await options.repository.findUserEmail(userId);

    if (email === undefined || email.length === 0) {
      throw new AppError({
        code: APP_ERROR_CODES.VALIDATION_ERROR,
        message: "A verified account email is required for checkout",
      });
    }

    return email;
  }

  return {
    getEntitlements,

    async resolvePlan(userId) {
      const entitlements = await getEntitlements(userId);
      return entitlements.plan;
    },

    async getConversionUsage(userId) {
      const period = getUtcMonthPeriod(now());
      return options.repository.getOrCreateUsagePeriod({
        userId,
        periodStart: period.start,
        periodEnd: period.end,
      });
    },

    async getBillingStatus(input) {
      const entitlements = await getEntitlements(input.userId);
      const period = getUtcMonthPeriod(now());
      const usage = await options.repository.getOrCreateUsagePeriod({
        userId: input.userId,
        periodStart: period.start,
        periodEnd: period.end,
      });
      const customer = await options.repository.findCustomerByUserId(
        input.userId,
      );

      return {
        plan: entitlements.plan,
        subscriptionStatus: entitlements.subscriptionStatus,
        cancelAtPeriodEnd: entitlements.cancelAtPeriodEnd,
        currentPeriodEnd: entitlements.currentPeriodEnd?.toISOString() ?? null,
        canUpgrade: entitlements.plan === "free",
        canManage: customer !== undefined,
        usage: {
          conversionsUsed: usage.conversionsUsed,
          conversionsLimit: entitlements.limits.monthlyConversions,
          storageUsedBytes: input.storageUsedBytes,
          storageLimitBytes: entitlements.limits.storageBytes,
          apiKeyCount: input.apiKeyCount,
          apiKeyLimit: entitlements.limits.maxApiKeys,
          periodStart: period.start.toISOString(),
          periodEnd: period.end.toISOString(),
        },
        limits: {
          maxFileSizeBytes: entitlements.limits.maxFileSizeBytes,
          apiAccess: entitlements.limits.apiAccess,
        },
      };
    },

    async assertCanCreateConversion(userId) {
      const entitlements = await getEntitlements(userId);
      const usage = await this.getConversionUsage(userId);
      assertCanCreateConversion({
        used: usage.conversionsUsed,
        limit: entitlements.limits.monthlyConversions,
      });
    },

    async assertCanUploadFile(input) {
      const entitlements = await getEntitlements(input.userId);
      assertCanUploadFile({
        sizeBytes: input.sizeBytes,
        storageUsedBytes: input.storageUsedBytes,
        limits: entitlements.limits,
      });
    },

    async assertCanCreateApiKey(input) {
      const entitlements = await getEntitlements(input.userId);
      assertCanCreateApiKey({
        used: input.used,
        limit: entitlements.limits.maxApiKeys,
      });
    },

    async recordConversionUsage(input) {
      const period = getUtcMonthPeriod(now());
      return options.repository.recordConversionUsage({
        userId: input.userId,
        conversionId: input.conversionId,
        periodStart: period.start,
        periodEnd: period.end,
      });
    },

    async createCheckout(userId) {
      const polar = options.polarClient;
      const polarConfig = assertPolarCheckoutConfig(options.config.polar);

      if (polar === undefined) {
        throw new AppError({
          code: APP_ERROR_CODES.CONFIGURATION_ERROR,
          message: "Polar checkout is not configured",
        });
      }

      const entitlements = await getEntitlements(userId);

      if (entitlements.plan === "pro") {
        throw new AppError({
          code: APP_ERROR_CODES.CONFLICT,
          message: "The current plan already includes Pro",
        });
      }

      await ensurePolarCustomer(userId);
      const checkout = await polar.createCheckout({
        productId: polarConfig.proProductId,
        externalCustomerId: userId,
        successUrl: checkoutSuccessUrl(options.config),
      });

      return { url: checkout.url };
    },

    async createCustomerPortal(userId) {
      const polar = options.polarClient;

      if (polar === undefined) {
        throw new AppError({
          code: APP_ERROR_CODES.CONFIGURATION_ERROR,
          message: "Polar checkout is not configured",
        });
      }

      const customer = await ensurePolarCustomer(userId);
      const portal = await polar.createCustomerPortal({
        customerId: customer.polarCustomerId,
      });

      return { url: portal.url };
    },

    async handleWebhook(input) {
      return handlePolarWebhook({
        body: input.body,
        headers: input.headers,
        config: options.config.polar,
        repository: options.repository,
        verifyWebhook: options.verifyWebhook,
        now,
      });
    },
  };
}
