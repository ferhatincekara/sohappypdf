import {
  assertPolarCheckoutConfig,
  type BillingConfig,
  loadApiCreditConfig,
} from "@repo/config";
import { isConversionFailureCode } from "@repo/conversions";
import { APP_ERROR_CODES, AppError } from "@repo/core";
import { resolveAiCreditCost, usesAiCredits } from "./ai-credit-cost.js";
import { shouldRefundAiCredits } from "./ai-credit-refund.js";
import { resolveApiCreditCost, usesApiCredits } from "./api-credit-cost.js";
import { shouldRefundApiCredits } from "./api-credit-refund.js";
import type { BillingRepository } from "./billing-repository.js";
import type {
  AiCreditBalance,
  ApiCreditBalance,
  CheckoutProductKey,
  PolarClient,
  PublicBillingStatus,
  VerifyPolarWebhook,
  WebCreditBalance,
} from "./billing-types.js";
import {
  assertCanCreateApiKey,
  assertCanCreateConversion,
  assertCanSpendAiCredits,
  assertCanSpendApiCredits,
  assertCanSpendWebCredits,
  assertCanUploadFile,
  isActiveApiSubscription,
  resolvePlan,
} from "./entitlements.js";
import { buildPlanCatalog, getPlanLimits } from "./plan-config.js";
import type { PlanCatalog, PlanId, UserEntitlements } from "./plan-types.js";
import {
  apiProductKeyFromPolarProductId,
  isWebProPolarProduct,
  listConfiguredCheckoutProducts,
  monthlyApiCreditsForProduct,
  polarProductIdForCheckout,
} from "./polar-products.js";
import {
  parsePolarSubscription,
  planFromPolarProductId,
} from "./polar-subscription.js";
import { getUtcMonthPeriod } from "./usage-period.js";
import { resolveWebCreditCost } from "./web-credit-cost.js";
import { resolveWebCreditPeriod } from "./web-credit-period.js";
import { shouldRefundWebCredits } from "./web-credit-refund.js";
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
  getWebCreditBalance(userId: string): Promise<WebCreditBalance>;
  getAiCreditBalance(userId: string): Promise<AiCreditBalance>;
  getBillingStatus(input: {
    userId: string;
    storageUsedBytes: number;
    apiKeyCount: number;
  }): Promise<PublicBillingStatus>;
  assertCanCreateConversion(userId: string): Promise<void>;
  assertCanSpendWebCredits(input: {
    userId: string;
    toolId: string;
    amount?: number;
  }): Promise<void>;
  assertCanSpendAiCredits(input: {
    userId: string;
    toolId: string;
    amount?: number;
  }): Promise<void>;
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
  consumeWebCredits(input: {
    userId: string;
    conversionId: string;
    toolId: string;
  }): Promise<boolean>;
  refundWebCredits(input: {
    userId: string;
    conversionId: string;
    reason: string;
  }): Promise<boolean>;
  refundWebCreditsForFailure(input: {
    userId: string;
    conversionId: string;
    errorCode: string;
  }): Promise<boolean>;
  consumeAiCredits(input: {
    userId: string;
    conversionId: string;
    toolId: string;
  }): Promise<boolean>;
  refundAiCredits(input: {
    userId: string;
    conversionId: string;
    reason: string;
  }): Promise<boolean>;
  refundAiCreditsForFailure(input: {
    userId: string;
    conversionId: string;
    errorCode: string;
  }): Promise<boolean>;
  getApiCreditBalance(userId: string): Promise<ApiCreditBalance>;
  assertCanSpendApiCredits(input: {
    userId: string;
    toolId: string;
    amount?: number;
  }): Promise<void>;
  consumeApiCredits(input: {
    userId: string;
    conversionId: string;
    toolId: string;
  }): Promise<boolean>;
  refundApiCredits(input: {
    userId: string;
    conversionId: string;
    reason: string;
  }): Promise<boolean>;
  refundApiCreditsForFailure(input: {
    userId: string;
    conversionId: string;
    errorCode: string;
  }): Promise<boolean>;
  createCheckout(
    userId: string,
    product?: CheckoutProductKey,
  ): Promise<{ url: string }>;
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
  const catalog = options.planCatalog ?? buildPlanCatalog();

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

  async function resolveUsageContext(userId: string) {
    const subscription =
      await options.repository.findLatestSubscriptionByUserId(userId);
    const current = now();
    const entitlements = await getEntitlements(userId);
    const period = resolveWebCreditPeriod({
      subscription: subscription ?? null,
      now: current,
    });

    return {
      entitlements,
      period,
      subscription: subscription ?? null,
    };
  }

  async function ensureWebCreditBalance(
    userId: string,
  ): Promise<WebCreditBalance> {
    const { entitlements, period } = await resolveUsageContext(userId);

    return options.repository.ensureWebCreditGrant({
      userId,
      periodStart: period.start,
      periodEnd: period.end,
      grantAmount: entitlements.limits.monthlyWebCredits,
      now: now(),
    });
  }

  async function ensureAiCreditBalance(
    userId: string,
  ): Promise<AiCreditBalance> {
    const { entitlements, period } = await resolveUsageContext(userId);

    return options.repository.ensureAiCreditGrant({
      userId,
      periodStart: period.start,
      periodEnd: period.end,
      grantAmount: entitlements.limits.monthlyAiCredits,
      now: now(),
    });
  }

  async function resolveActiveApiGrant(userId: string) {
    const current = now();
    const subscriptions =
      await options.repository.listApiSubscriptionsByUserId(userId);
    const creditConfig = loadApiCreditConfig();
    let monthlyCredits = 0;
    let product: Awaited<
      ReturnType<BillingRepository["findLatestApiSubscriptionByUserId"]>
    >;

    for (const subscription of subscriptions) {
      if (!isActiveApiSubscription(subscription, current)) {
        continue;
      }

      const credits = monthlyApiCreditsForProduct(
        subscription.productKey,
        creditConfig,
      );

      if (credits >= monthlyCredits) {
        monthlyCredits = credits;
        product = subscription;
      }
    }

    return { monthlyCredits, subscription: product };
  }

  async function ensureApiCreditBalance(
    userId: string,
  ): Promise<ApiCreditBalance> {
    const period = getUtcMonthPeriod(now());
    const { monthlyCredits } = await resolveActiveApiGrant(userId);

    return options.repository.ensureApiCreditGrant({
      userId,
      periodStart: period.start,
      periodEnd: period.end,
      grantAmount: monthlyCredits,
      now: now(),
    });
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

  async function applyRemoteSubscription(
    userId: string,
    data: unknown,
  ): Promise<void> {
    const parsed = parsePolarSubscription(data);

    if (parsed === undefined) {
      return;
    }

    if (parsed.polarCustomerId !== null) {
      await options.repository.upsertCustomer({
        userId,
        polarCustomerId: parsed.polarCustomerId,
        createdAt: now(),
        updatedAt: now(),
      });
    }

    if (isWebProPolarProduct(parsed.polarProductId, options.config.polar)) {
      await options.repository.upsertSubscription({
        userId,
        polarSubscriptionId: parsed.polarSubscriptionId,
        polarProductId: parsed.polarProductId,
        plan: planFromPolarProductId(
          parsed.polarProductId,
          options.config.polar.proProductId,
        ),
        status: parsed.status,
        cancelAtPeriodEnd: parsed.cancelAtPeriodEnd,
        currentPeriodStart: parsed.currentPeriodStart,
        currentPeriodEnd: parsed.currentPeriodEnd,
        endedAt: parsed.endedAt,
        updatedAt: now(),
      });
    }

    const apiProductKey = apiProductKeyFromPolarProductId(
      parsed.polarProductId,
      options.config.polar,
    );

    if (apiProductKey !== undefined) {
      await options.repository.upsertApiSubscription({
        userId,
        polarSubscriptionId: parsed.polarSubscriptionId,
        polarProductId: parsed.polarProductId,
        productKey: apiProductKey,
        status: parsed.status,
        cancelAtPeriodEnd: parsed.cancelAtPeriodEnd,
        currentPeriodStart: parsed.currentPeriodStart,
        currentPeriodEnd: parsed.currentPeriodEnd,
        endedAt: parsed.endedAt,
        updatedAt: now(),
      });
    }
  }

  async function revokeLocalSubscription(userId: string): Promise<void> {
    const existing =
      await options.repository.findLatestSubscriptionByUserId(userId);

    if (existing === undefined) {
      return;
    }

    await options.repository.upsertSubscription({
      ...existing,
      status: "revoked",
      cancelAtPeriodEnd: false,
      endedAt: existing.endedAt ?? now(),
      updatedAt: now(),
    });
  }

  async function reconcileFromPolar(userId: string): Promise<void> {
    const polar = options.polarClient;

    if (polar === undefined) {
      return;
    }

    try {
      const remote = await polar.listSubscriptionsByExternalId(userId);

      if (remote.length === 0) {
        await revokeLocalSubscription(userId);
        return;
      }

      for (const subscription of remote) {
        await applyRemoteSubscription(userId, subscription);
      }
    } catch {
      return;
    }
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
      const usage = await options.repository.getOrCreateUsagePeriod({
        userId,
        periodStart: period.start,
        periodEnd: period.end,
      });
      return { conversionsUsed: usage.conversionsUsed };
    },

    async getWebCreditBalance(userId) {
      return ensureWebCreditBalance(userId);
    },

    async getAiCreditBalance(userId) {
      return ensureAiCreditBalance(userId);
    },

    async getApiCreditBalance(userId) {
      return ensureApiCreditBalance(userId);
    },

    async getBillingStatus(input) {
      await reconcileFromPolar(input.userId);
      const { entitlements, period } = await resolveUsageContext(input.userId);
      const balance = await ensureWebCreditBalance(input.userId);
      const aiBalance = await ensureAiCreditBalance(input.userId);
      const apiBalance = await ensureApiCreditBalance(input.userId);
      const apiGrant = await resolveActiveApiGrant(input.userId);
      const apiPeriod = getUtcMonthPeriod(now());
      const conversionPeriod = apiPeriod;
      const conversionUsage = await options.repository.getOrCreateUsagePeriod({
        userId: input.userId,
        periodStart: conversionPeriod.start,
        periodEnd: conversionPeriod.end,
      });
      const customer = await options.repository.findCustomerByUserId(
        input.userId,
      );
      const recentUsage = await options.repository.listApiCreditLedger({
        userId: input.userId,
        limit: 20,
      });
      const configuredProducts = listConfiguredCheckoutProducts(
        options.config.polar,
      );
      const apiProducts = configuredProducts.filter((key) => key !== "pro");

      return {
        plan: entitlements.plan,
        subscriptionStatus: entitlements.subscriptionStatus,
        cancelAtPeriodEnd: entitlements.cancelAtPeriodEnd,
        currentPeriodEnd: entitlements.currentPeriodEnd?.toISOString() ?? null,
        canUpgrade: entitlements.plan === "free",
        canManage: customer !== undefined,
        usage: {
          webCreditsUsed: balance.webCreditsUsed,
          webCreditsLimit: entitlements.limits.monthlyWebCredits,
          aiCreditsUsed: aiBalance.aiCreditsUsed,
          aiCreditsLimit: entitlements.limits.monthlyAiCredits,
          conversionsUsed: conversionUsage.conversionsUsed,
          conversionsLimit: entitlements.limits.monthlyConversions,
          storageUsedBytes: input.storageUsedBytes,
          storageLimitBytes: entitlements.limits.storageBytes,
          apiKeyCount: input.apiKeyCount,
          apiKeyLimit: entitlements.limits.maxApiKeys,
          periodStart: period.start.toISOString(),
          periodEnd: period.end.toISOString(),
        },
        api: {
          product: apiGrant.subscription?.productKey ?? null,
          subscriptionStatus: apiGrant.subscription?.status ?? null,
          creditsUsed: apiBalance.apiCreditsUsed,
          creditsLimit: apiBalance.apiCreditsGranted,
          creditsRemaining: apiBalance.apiCreditsRemaining,
          recentUsage,
          canSubscribe: apiProducts.some((key) => key !== "api-pack"),
          canTopUp: apiProducts.includes("api-pack"),
          availableProducts: apiProducts,
          periodStart: apiPeriod.start.toISOString(),
          periodEnd: apiPeriod.end.toISOString(),
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

    async assertCanSpendWebCredits(input) {
      const balance = await ensureWebCreditBalance(input.userId);
      const amount = input.amount ?? resolveWebCreditCost(input.toolId);
      assertCanSpendWebCredits({
        used: balance.webCreditsUsed,
        granted: balance.webCreditsGranted,
        amount,
      });
    },

    async assertCanSpendAiCredits(input) {
      const balance = await ensureAiCreditBalance(input.userId);
      const amount = input.amount ?? resolveAiCreditCost(input.toolId);
      assertCanSpendAiCredits({
        used: balance.aiCreditsUsed,
        granted: balance.aiCreditsGranted,
        amount,
      });
    },

    async assertCanSpendApiCredits(input) {
      const balance = await ensureApiCreditBalance(input.userId);
      const amount = input.amount ?? resolveApiCreditCost(input.toolId);
      assertCanSpendApiCredits({
        used: balance.apiCreditsUsed,
        granted: balance.apiCreditsGranted,
        amount,
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

    async consumeWebCredits(input) {
      const { period } = await resolveUsageContext(input.userId);
      await ensureWebCreditBalance(input.userId);
      const amount = resolveWebCreditCost(input.toolId);

      return options.repository.consumeWebCredits({
        userId: input.userId,
        periodStart: period.start,
        periodEnd: period.end,
        amount,
        toolId: input.toolId,
        executionId: input.conversionId,
        reason: "tool_execution",
        now: now(),
      });
    },

    async refundWebCredits(input) {
      return options.repository.refundWebCredits({
        userId: input.userId,
        executionId: input.conversionId,
        reason: input.reason,
        now: now(),
      });
    },

    async refundWebCreditsForFailure(input) {
      if (!isConversionFailureCode(input.errorCode)) {
        return false;
      }

      if (!shouldRefundWebCredits(input.errorCode)) {
        return false;
      }

      return this.refundWebCredits({
        userId: input.userId,
        conversionId: input.conversionId,
        reason: "execution_failed",
      });
    },

    async consumeAiCredits(input) {
      if (!usesAiCredits(input.toolId)) {
        return false;
      }

      const { period } = await resolveUsageContext(input.userId);
      await ensureAiCreditBalance(input.userId);
      const amount = resolveAiCreditCost(input.toolId);

      return options.repository.consumeAiCredits({
        userId: input.userId,
        periodStart: period.start,
        periodEnd: period.end,
        amount,
        toolId: input.toolId,
        executionId: input.conversionId,
        reason: "tool_execution",
        now: now(),
      });
    },

    async refundAiCredits(input) {
      return options.repository.refundAiCredits({
        userId: input.userId,
        executionId: input.conversionId,
        reason: input.reason,
        now: now(),
      });
    },

    async refundAiCreditsForFailure(input) {
      if (!isConversionFailureCode(input.errorCode)) {
        return false;
      }

      if (!shouldRefundAiCredits(input.errorCode)) {
        return false;
      }

      return this.refundAiCredits({
        userId: input.userId,
        conversionId: input.conversionId,
        reason: "execution_failed",
      });
    },

    async consumeApiCredits(input) {
      if (!usesApiCredits(input.toolId)) {
        return false;
      }

      const period = getUtcMonthPeriod(now());
      await ensureApiCreditBalance(input.userId);
      const amount = resolveApiCreditCost(input.toolId);

      return options.repository.consumeApiCredits({
        userId: input.userId,
        periodStart: period.start,
        periodEnd: period.end,
        amount,
        toolId: input.toolId,
        executionId: input.conversionId,
        reason: "tool_execution",
        now: now(),
      });
    },

    async refundApiCredits(input) {
      return options.repository.refundApiCredits({
        userId: input.userId,
        executionId: input.conversionId,
        reason: input.reason,
        now: now(),
      });
    },

    async refundApiCreditsForFailure(input) {
      if (!isConversionFailureCode(input.errorCode)) {
        return false;
      }

      if (!shouldRefundApiCredits(input.errorCode)) {
        return false;
      }

      return this.refundApiCredits({
        userId: input.userId,
        conversionId: input.conversionId,
        reason: "execution_failed",
      });
    },

    async createCheckout(userId, product = "pro") {
      const polar = options.polarClient;
      const productId = polarProductIdForCheckout(
        product,
        options.config.polar,
      );

      if (polar === undefined || productId === undefined) {
        if (product === "pro") {
          assertPolarCheckoutConfig(options.config.polar);
        }

        throw new AppError({
          code: APP_ERROR_CODES.CONFIGURATION_ERROR,
          message: "Polar checkout is not configured",
        });
      }

      if (product === "pro") {
        assertPolarCheckoutConfig(options.config.polar);
        const entitlements = await getEntitlements(userId);

        if (entitlements.plan === "pro") {
          throw new AppError({
            code: APP_ERROR_CODES.CONFLICT,
            message: "The current plan already includes Pro",
          });
        }
      }

      await ensurePolarCustomer(userId);
      const checkout = await polar.createCheckout({
        productId,
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
