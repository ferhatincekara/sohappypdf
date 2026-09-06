import {
  assertPolarCheckoutConfig,
  type BillingConfig,
  loadApiCreditConfig,
} from "@sohappypdf/config";
import { isConversionFailureCode } from "@sohappypdf/conversions";
import { APP_ERROR_CODES, AppError, isAppError } from "@sohappypdf/core";
import {
  assertToolAllowedOnPlan,
  findRegisteredTool,
  toolCombinesSourceFiles,
  toolSupportsBatchOperations,
} from "@sohappypdf/tools";
import { resolveAiCreditCost, usesAiCredits } from "./ai-credit-cost.js";
import { shouldRefundAiCredits } from "./ai-credit-refund.js";
import { resolveApiCreditCost, usesApiCredits } from "./api-credit-cost.js";
import { resolveApiCreditPeriod } from "./api-credit-period.js";
import { shouldRefundApiCredits } from "./api-credit-refund.js";
import type { BillingRepository } from "./billing-repository.js";
import type {
  AiCreditBalance,
  ApiCreditBalance,
  BillingCatalogPrices,
  CheckoutProductKey,
  PolarClient,
  PublicBillingStatus,
  VerifyPolarWebhook,
  WebCreditBalance,
} from "./billing-types.js";
import {
  INCLUDED_API_CREDITS_PER_MONTH,
  includedApiCreditBalance,
} from "./default-plan-limits.js";
import {
  assertCanCreateApiKey,
  assertCanCreateConversion,
  assertCanSpendAiCredits,
  assertCanSpendApiCredits,
  assertCanSpendWebCredits,
  assertCanUploadFile,
  assertCanUseFileCount,
  isActiveApiSubscription,
  resolvePlan,
} from "./entitlements.js";
import {
  buildPlanCatalog,
  DEFAULT_PLAN_LIMITS,
  getPlanLimits,
} from "./plan-config.js";
import type { PlanCatalog, PlanId, UserEntitlements } from "./plan-types.js";
import { createCatalogPriceLoader } from "./polar-catalog-prices.js";
import {
  isPolarCustomerActionRecoverable,
  resolvePolarReturnUrl,
} from "./polar-client.js";
import {
  apiProductKeyFromCheckoutProductKey,
  apiProductKeyFromPolarProductId,
  type BillingInterval,
  billingIntervalFromPolarProductId,
  isApiCheckoutProductKey,
  isWebProPolarProduct,
  listConfiguredCheckoutProducts,
  monthlyApiCreditsForProduct,
  polarCheckoutProductIds,
  polarProductIdForSubscriptionUpdate,
} from "./polar-products.js";
import {
  parsePolarSubscription,
  planFromPolarProductId,
} from "./polar-subscription.js";
import { getUtcDayPeriod, getUtcMonthPeriod } from "./usage-period.js";
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
  getCatalogPrices(): Promise<BillingCatalogPrices>;
  assertCanCreateConversion(userId: string): Promise<void>;
  assertCanUseFileCount(input: {
    userId: string;
    fileCount: number;
    toolId?: string;
  }): Promise<void>;
  assertCanUseTool(input: { userId: string; toolId: string }): Promise<void>;
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
    channel?: "web" | "api";
  }): Promise<void>;
  assertCanCreateApiKey(input: { userId: string; used: number }): Promise<void>;
  recordConversionUsage(input: {
    userId: string;
    conversionId: string;
    toolId?: string | null;
    apiKeyId?: string | null;
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
    interval?: BillingInterval,
  ): Promise<{ url: string | null }>;
  createCustomerPortal(userId: string): Promise<{ url: string }>;
  handleWebhook(input: {
    body: string;
    headers: Record<string, string>;
  }): Promise<{ outcome: "applied" | "duplicate" | "ignored" }>;
  getPlanCatalog(): PlanCatalog;
  adjustCredits(input: {
    userId: string;
    source: "web" | "api" | "ai";
    amount: number;
    reason: string;
    actorUserId: string;
  }): Promise<void>;
};

function checkoutSuccessUrl(config: BillingConfig): string {
  return `${config.appUrl}${config.successPath}?checkout=success`;
}

export function createBillingService(
  options: BillingServiceOptions,
): BillingService {
  const now = options.now ?? (() => new Date());
  const catalog = options.planCatalog ?? buildPlanCatalog();
  const polarClient = options.polarClient;
  const loadCatalogPrices = createCatalogPriceLoader({
    polar: options.config.polar,
    getProduct:
      polarClient === undefined
        ? undefined
        : (id) => polarClient.getProduct(id),
  });

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

  async function resolveApiUsageContext(userId: string) {
    const current = now();
    const grant = await resolveActiveApiGrant(userId);

    return {
      monthlyCredits: grant.monthlyCredits,
      subscription: grant.subscription,
      period: resolveApiCreditPeriod({
        subscription: grant.subscription ?? null,
        now: current,
      }),
      now: current,
    };
  }

  async function ensureApiCreditBalance(
    userId: string,
  ): Promise<ApiCreditBalance> {
    const {
      monthlyCredits,
      period,
      now: current,
    } = await resolveApiUsageContext(userId);

    if (monthlyCredits === 0) {
      const balance = await options.repository.ensureApiCreditGrant({
        userId,
        periodStart: period.start,
        periodEnd: period.end,
        grantAmount: INCLUDED_API_CREDITS_PER_MONTH,
        now: current,
      });
      const adjustmentTotal =
        await options.repository.sumManualCreditAdjustments({
          userId,
          source: "api",
          periodStart: period.start,
        });
      return includedApiCreditBalance({
        ...balance,
        adjustmentTotal,
      });
    }
    const legacyCalendar = getUtcMonthPeriod(period.start);
    const adminExtra = await sumApiAdminAdjustments(userId, [
      period.start,
      legacyCalendar.start,
    ]);
    const targetGranted = monthlyCredits + Math.max(0, adminExtra);

    const balance = await options.repository.ensureApiCreditGrant({
      userId,
      periodStart: period.start,
      periodEnd: period.end,
      grantAmount: monthlyCredits,
      now: current,
    });

    if (balance.apiCreditsGranted >= targetGranted) {
      return balance;
    }

    await options.repository.grantApiCreditTopUp({
      userId,
      periodStart: period.start,
      periodEnd: period.end,
      amount: targetGranted - balance.apiCreditsGranted,
      providerEventId: `api-pack:${userId}:${period.start.toISOString()}:${String(targetGranted)}`,
      now: current,
    });

    return options.repository.ensureApiCreditGrant({
      userId,
      periodStart: period.start,
      periodEnd: period.end,
      grantAmount: monthlyCredits,
      now: current,
    });
  }

  async function sumApiAdminAdjustments(
    userId: string,
    periodStarts: readonly Date[],
  ): Promise<number> {
    const seen = new Set<number>();
    let total = 0;

    for (const periodStart of periodStarts) {
      const key = periodStart.getTime();

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      total += await options.repository.sumManualCreditAdjustments({
        userId,
        source: "api",
        periodStart,
      });
    }

    return total;
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
    const remote = await polar.findCustomerByExternalId(userId);

    if (remote !== null) {
      return options.repository.upsertCustomer({
        userId,
        polarCustomerId: remote.id,
        createdAt: existing?.createdAt ?? now(),
        updatedAt: now(),
      });
    }

    const polarCustomer = await polar.createCustomer({
      email: await requireUserEmail(userId),
      externalId: userId,
    });

    return options.repository.upsertCustomer({
      userId,
      polarCustomerId: polarCustomer.id,
      createdAt: existing?.createdAt ?? now(),
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
          options.config.polar,
        ),
        status: parsed.status,
        cancelAtPeriodEnd: parsed.cancelAtPeriodEnd,
        currentPeriodStart: parsed.currentPeriodStart,
        currentPeriodEnd: parsed.currentPeriodEnd,
        endedAt: parsed.endedAt,
        updatedAt: now(),
      });
      await revokeLocalApiSubscriptionIfPolarId(
        userId,
        parsed.polarSubscriptionId,
      );
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
      await revokeLocalSubscriptionIfPolarId(
        userId,
        parsed.polarSubscriptionId,
      );
    }
  }

  async function revokeLocalSubscriptionIfPolarId(
    userId: string,
    polarSubscriptionId: string,
  ): Promise<void> {
    const existing =
      await options.repository.findLatestSubscriptionByUserId(userId);

    if (
      existing === undefined ||
      existing.polarSubscriptionId !== polarSubscriptionId
    ) {
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

  async function revokeLocalApiSubscriptionIfPolarId(
    userId: string,
    polarSubscriptionId: string,
  ): Promise<void> {
    const subscriptions =
      await options.repository.listApiSubscriptionsByUserId(userId);

    for (const existing of subscriptions) {
      if (existing.polarSubscriptionId !== polarSubscriptionId) {
        continue;
      }

      await options.repository.upsertApiSubscription({
        ...existing,
        status: "revoked",
        cancelAtPeriodEnd: false,
        endedAt: existing.endedAt ?? now(),
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

  async function revokeLocalApiSubscriptions(userId: string): Promise<void> {
    const subscriptions =
      await options.repository.listApiSubscriptionsByUserId(userId);

    for (const existing of subscriptions) {
      if (
        existing.status === "revoked" &&
        existing.endedAt !== null &&
        existing.endedAt.getTime() <= now().getTime()
      ) {
        continue;
      }

      await options.repository.upsertApiSubscription({
        ...existing,
        status: "revoked",
        cancelAtPeriodEnd: false,
        endedAt: existing.endedAt ?? now(),
        updatedAt: now(),
      });
    }
  }

  async function reconcileFromPolar(userId: string): Promise<void> {
    const polar = options.polarClient;

    if (polar === undefined) {
      return;
    }

    try {
      const remote = await listRemotePolarSubscriptions(userId);

      if (remote.length === 0) {
        await revokeLocalSubscription(userId);
        await revokeLocalApiSubscriptions(userId);
        return;
      }

      for (const subscription of remote) {
        await applyRemoteSubscription(userId, subscription);
      }

      const parsedRemotes = remote.flatMap((subscription) => {
        const parsed = parsePolarSubscription(subscription);
        return parsed === undefined ? [] : [parsed];
      });
      const hasRemotePro = parsedRemotes.some((subscription) =>
        isWebProPolarProduct(subscription.polarProductId, options.config.polar),
      );
      const hasRemoteApi = parsedRemotes.some(
        (subscription) =>
          apiProductKeyFromPolarProductId(
            subscription.polarProductId,
            options.config.polar,
          ) !== undefined,
      );

      if (!hasRemotePro) {
        await revokeLocalSubscription(userId);
      }

      if (!hasRemoteApi) {
        await revokeLocalApiSubscriptions(userId);
      }
    } catch {
      return;
    }
  }

  async function listRemotePolarSubscriptions(
    userId: string,
  ): Promise<unknown[]> {
    const polar = options.polarClient;

    if (polar === undefined) {
      return [];
    }

    const byExternalId = await polar.listSubscriptionsByExternalId(userId);
    if (byExternalId.length > 0) {
      return byExternalId;
    }

    let local = await options.repository.findCustomerByUserId(userId);
    if (local === undefined) {
      try {
        local = await ensurePolarCustomer(userId);
      } catch {
        local = undefined;
      }
    }

    if (local !== undefined) {
      const byCustomerId = await polar.listSubscriptionsByCustomerId(
        local.polarCustomerId,
      );
      if (byCustomerId.length > 0) {
        return byCustomerId;
      }
    }

    const email = await options.repository.findUserEmail(userId);
    if (email === undefined || email.length === 0) {
      return [];
    }

    return polar.listSubscriptionsByEmail(email);
  }

  async function hasManagedPolarBilling(userId: string): Promise<boolean> {
    const web = await options.repository.findLatestSubscriptionByUserId(userId);
    if (web !== undefined) {
      return true;
    }

    const api =
      await options.repository.findLatestApiSubscriptionByUserId(userId);
    return api !== undefined;
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

  async function openPolarCheckout(input: {
    userId: string;
    productIds: readonly string[];
    subscriptionId?: string;
  }): Promise<{ url: string }> {
    const polarClient = options.polarClient;

    if (polarClient === undefined) {
      throw new AppError({
        code: APP_ERROR_CODES.CONFIGURATION_ERROR,
        message: "Polar checkout is not configured",
      });
    }

    await ensurePolarCustomer(input.userId);
    const customerEmail = await requireUserEmail(input.userId);
    const returnUrl = resolvePolarReturnUrl(
      `${options.config.appUrl}${options.config.successPath}`,
    );
    const checkout = await polarClient.createCheckout({
      productIds: input.productIds,
      externalCustomerId: input.userId,
      customerEmail,
      successUrl: checkoutSuccessUrl(options.config),
      ...(returnUrl === undefined ? {} : { returnUrl }),
      ...(input.subscriptionId === undefined
        ? {}
        : { subscriptionId: input.subscriptionId }),
    });

    return { url: checkout.url };
  }

  async function updateSubscriptionOrCheckout(input: {
    userId: string;
    productIds: readonly string[];
    productId: string;
    subscriptionId: string;
  }): Promise<{ url: string | null }> {
    const polarClient = options.polarClient;

    if (polarClient === undefined) {
      throw new AppError({
        code: APP_ERROR_CODES.CONFIGURATION_ERROR,
        message: "Polar checkout is not configured",
      });
    }

    try {
      await polarClient.updateSubscription({
        subscriptionId: input.subscriptionId,
        productId: input.productId,
      });
      await reconcileFromPolar(input.userId);
      return { url: null };
    } catch (error) {
      if (!isPolarCustomerActionRecoverable(error)) {
        throw error;
      }

      return openPolarCheckout({
        userId: input.userId,
        productIds: input.productIds,
        subscriptionId: input.subscriptionId,
      });
    }
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
      const apiPeriod = resolveApiCreditPeriod({
        subscription: apiGrant.subscription ?? null,
        now: now(),
      });
      const conversionPeriod = getUtcMonthPeriod(now());
      const conversionUsage = await options.repository.getOrCreateUsagePeriod({
        userId: input.userId,
        periodStart: conversionPeriod.start,
        periodEnd: conversionPeriod.end,
      });
      const recentUsage = await options.repository.listApiCreditLedger({
        userId: input.userId,
        periodStart: apiPeriod.start,
        limit: 20,
      });
      const configuredProducts = listConfiguredCheckoutProducts(
        options.config.polar,
      );
      const apiProducts = configuredProducts.filter((key) => key !== "pro");

      const dailyPeriod = getUtcDayPeriod(now());
      const dailyUsed =
        entitlements.limits.operationsPerDay === null
          ? conversionUsage.conversionsUsed
          : await options.repository.countConversionUsageSince({
              userId: input.userId,
              since: dailyPeriod.start,
            });

      const webSubscription =
        await options.repository.findLatestSubscriptionByUserId(input.userId);

      return {
        plan: entitlements.plan,
        subscriptionStatus: entitlements.subscriptionStatus,
        cancelAtPeriodEnd: entitlements.cancelAtPeriodEnd,
        currentPeriodEnd: entitlements.currentPeriodEnd?.toISOString() ?? null,
        canUpgrade: entitlements.plan === "free",
        canManage: await hasManagedPolarBilling(input.userId),
        interval:
          entitlements.plan === "pro" && webSubscription !== undefined
            ? billingIntervalFromPolarProductId(
                webSubscription.polarProductId,
                options.config.polar,
              )
            : null,
        usage: {
          webCreditsUsed: balance.webCreditsUsed,
          webCreditsLimit: balance.webCreditsGranted,
          webCreditsRemaining: balance.webCreditsRemaining,
          aiCreditsUsed: aiBalance.aiCreditsUsed,
          aiCreditsLimit: entitlements.limits.monthlyAiCredits,
          aiCreditsRemaining: aiBalance.aiCreditsRemaining,
          conversionsUsed: dailyUsed,
          conversionsLimit: entitlements.limits.operationsPerDay,
          storageUsedBytes: input.storageUsedBytes,
          storageLimitBytes: entitlements.limits.storageBytes,
          apiKeyCount: input.apiKeyCount,
          apiKeyLimit: entitlements.limits.maxApiKeys,
          periodStart: period.start.toISOString(),
          periodEnd: period.end.toISOString(),
        },
        api: {
          product: apiGrant.subscription?.productKey ?? null,
          interval:
            apiGrant.subscription === undefined
              ? null
              : billingIntervalFromPolarProductId(
                  apiGrant.subscription.polarProductId,
                  options.config.polar,
                ),
          subscriptionStatus: apiGrant.subscription?.status ?? null,
          creditsUsed: apiBalance.apiCreditsUsed,
          creditsLimit: apiBalance.apiCreditsGranted,
          creditsRemaining: apiBalance.apiCreditsRemaining,
          recentUsage,
          canSubscribe: apiProducts.some(
            (key) =>
              isApiCheckoutProductKey(key) &&
              apiProductKeyFromCheckoutProductKey(key) !==
                apiGrant.subscription?.productKey,
          ),
          availableProducts: apiProducts,
          periodStart: apiPeriod.start.toISOString(),
          periodEnd: apiPeriod.end.toISOString(),
        },
        limits: {
          maxFileSizeBytes: entitlements.limits.maxFileSizeBytes,
          maxFilesPerOperation: entitlements.limits.maxFilesPerOperation,
          maxPagesPerFile: entitlements.limits.maxPagesPerFile,
          apiAccess: entitlements.limits.apiAccess,
          apiRequestsPerMinute: entitlements.limits.apiRequestsPerMinute,
        },
        prices: await loadCatalogPrices(),
      };
    },

    async assertCanCreateConversion(userId) {
      const entitlements = await getEntitlements(userId);
      if (entitlements.limits.operationsPerDay !== null) {
        const dailyPeriod = getUtcDayPeriod(now());
        const usedToday = await options.repository.countConversionUsageSince({
          userId,
          since: dailyPeriod.start,
        });
        assertCanCreateConversion({
          used: usedToday,
          limit: entitlements.limits.operationsPerDay,
        });
      }

      if (entitlements.limits.monthlyConversions !== null) {
        const usage = await this.getConversionUsage(userId);
        assertCanCreateConversion({
          used: usage.conversionsUsed,
          limit: entitlements.limits.monthlyConversions,
        });
      }
    },

    async assertCanUseFileCount(input) {
      const entitlements = await getEntitlements(input.userId);
      const tool =
        input.toolId === undefined
          ? undefined
          : findRegisteredTool(input.toolId);
      assertCanUseFileCount({
        fileCount: input.fileCount,
        maxFilesPerOperation: entitlements.limits.maxFilesPerOperation,
        toolMaxInputCount: tool?.maxInputCount,
        combinesSourceFiles:
          tool === undefined ? false : toolCombinesSourceFiles(tool.id),
        supportsBatch:
          tool !== undefined && toolSupportsBatchOperations(tool.id),
      });
    },

    async assertCanUseTool(input) {
      const entitlements = await getEntitlements(input.userId);
      assertToolAllowedOnPlan(input.toolId, entitlements.plan);
    },

    async assertCanSpendWebCredits(input) {
      const entitlements = await getEntitlements(input.userId);
      if (entitlements.limits.operationsPerDay === null) {
        return;
      }

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
      const limits =
        input.channel === "api"
          ? {
              ...entitlements.limits,
              maxFileSizeBytes: DEFAULT_PLAN_LIMITS.pro.maxFileSizeBytes,
            }
          : entitlements.limits;
      assertCanUploadFile({
        sizeBytes: input.sizeBytes,
        storageUsedBytes: input.storageUsedBytes,
        limits,
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
        toolId: input.toolId ?? null,
        apiKeyId: input.apiKeyId ?? null,
        periodStart: period.start,
        periodEnd: period.end,
        createdAt: now(),
      });
    },

    async consumeWebCredits(input) {
      const entitlements = await getEntitlements(input.userId);
      if (entitlements.limits.operationsPerDay === null) {
        return true;
      }

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

      const { period } = await resolveApiUsageContext(input.userId);
      const balance = await ensureApiCreditBalance(input.userId);
      const amount = resolveApiCreditCost(input.toolId);
      assertCanSpendApiCredits({
        used: balance.apiCreditsUsed,
        granted: balance.apiCreditsGranted,
        amount,
      });

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

    async createCheckout(userId, product = "pro", interval = "monthly") {
      const polar = options.polarClient;
      const productIds = polarCheckoutProductIds(
        product,
        options.config.polar,
        interval,
      );

      if (polar === undefined || productIds.length === 0) {
        if (product === "pro") {
          assertPolarCheckoutConfig(options.config.polar);
        }

        throw new AppError({
          code: APP_ERROR_CODES.CONFIGURATION_ERROR,
          message: "Polar checkout is not configured",
        });
      }

      await reconcileFromPolar(userId);

      if (product === "pro") {
        assertPolarCheckoutConfig(options.config.polar);
        const entitlements = await getEntitlements(userId);
        const webSubscription =
          await options.repository.findLatestSubscriptionByUserId(userId);

        if (entitlements.plan === "pro" && webSubscription !== undefined) {
          const currentInterval = billingIntervalFromPolarProductId(
            webSubscription.polarProductId,
            options.config.polar,
          );

          if (currentInterval === interval) {
            throw new AppError({
              code: APP_ERROR_CODES.CONFLICT,
              message: "The current plan already includes Pro",
            });
          }

          const productId = polarProductIdForSubscriptionUpdate(
            product,
            webSubscription.polarProductId,
            options.config.polar,
            interval,
          );

          if (productId === undefined) {
            throw new AppError({
              code: APP_ERROR_CODES.CONFIGURATION_ERROR,
              message: "Polar checkout is not configured",
            });
          }

          if (productId === webSubscription.polarProductId) {
            throw new AppError({
              code: APP_ERROR_CODES.CONFLICT,
              message: "The current plan already includes Pro",
            });
          }

          return updateSubscriptionOrCheckout({
            userId,
            productIds,
            productId,
            subscriptionId: webSubscription.polarSubscriptionId,
          });
        }
      }

      if (isApiCheckoutProductKey(product)) {
        const apiGrant = await resolveActiveApiGrant(userId);
        const requestedPack = apiProductKeyFromCheckoutProductKey(product);

        if (apiGrant.subscription !== undefined) {
          const currentInterval = billingIntervalFromPolarProductId(
            apiGrant.subscription.polarProductId,
            options.config.polar,
          );

          if (
            apiGrant.subscription.productKey === requestedPack &&
            currentInterval === interval
          ) {
            throw new AppError({
              code: APP_ERROR_CODES.CONFLICT,
              message: "The current plan already includes an API pack",
            });
          }

          const productId = polarProductIdForSubscriptionUpdate(
            product,
            apiGrant.subscription.polarProductId,
            options.config.polar,
            interval,
          );

          if (productId === undefined) {
            throw new AppError({
              code: APP_ERROR_CODES.CONFIGURATION_ERROR,
              message: "Polar checkout is not configured",
            });
          }

          if (productId === apiGrant.subscription.polarProductId) {
            throw new AppError({
              code: APP_ERROR_CODES.CONFLICT,
              message: "The current plan already includes an API pack",
            });
          }

          return updateSubscriptionOrCheckout({
            userId,
            productIds,
            productId,
            subscriptionId: apiGrant.subscription.polarSubscriptionId,
          });
        }
      }

      return openPolarCheckout({
        userId,
        productIds,
      });
    },

    async createCustomerPortal(userId) {
      const polar = options.polarClient;

      if (polar === undefined) {
        throw new AppError({
          code: APP_ERROR_CODES.CONFIGURATION_ERROR,
          message: "Polar checkout is not configured",
        });
      }

      if (!(await hasManagedPolarBilling(userId))) {
        throw new AppError({
          code: APP_ERROR_CODES.NOT_FOUND,
          message: "Polar customer portal was not found",
        });
      }

      await ensurePolarCustomer(userId);
      const customer = await options.repository.findCustomerByUserId(userId);
      const returnUrl = resolvePolarReturnUrl(
        `${options.config.appUrl}${options.config.successPath}`,
      );

      try {
        const portal = await polar.createCustomerPortal({
          externalCustomerId: userId,
          customerId: customer?.polarCustomerId,
          ...(returnUrl === undefined ? {} : { returnUrl }),
        });
        return { url: portal.url };
      } catch (error) {
        if (
          !isAppError(error) ||
          (error.code !== APP_ERROR_CODES.NOT_FOUND &&
            error.code !== APP_ERROR_CODES.VALIDATION_ERROR)
        ) {
          throw error;
        }

        const remote = await polar.findCustomerByExternalId(userId);
        const polarCustomer =
          remote ??
          (await polar.createCustomer({
            email: await requireUserEmail(userId),
            externalId: userId,
          }));

        await options.repository.upsertCustomer({
          userId,
          polarCustomerId: polarCustomer.id,
          createdAt: now(),
          updatedAt: now(),
        });

        const portal = await polar.createCustomerPortal({
          externalCustomerId: userId,
          customerId: polarCustomer.id,
          ...(returnUrl === undefined ? {} : { returnUrl }),
        });
        return { url: portal.url };
      }
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

    getPlanCatalog() {
      return catalog;
    },

    async getCatalogPrices() {
      return loadCatalogPrices();
    },

    async adjustCredits(input) {
      const reason = input.reason.trim();
      const actorUserId = input.actorUserId.trim();

      if (actorUserId.length === 0) {
        throw new AppError({
          code: APP_ERROR_CODES.VALIDATION_ERROR,
          message: "Administrator identity is required",
        });
      }

      if (reason.length < 8 || reason.length > 500) {
        throw new AppError({
          code: APP_ERROR_CODES.VALIDATION_ERROR,
          message: "A reason between 8 and 500 characters is required",
        });
      }

      if (
        input.source !== "web" &&
        input.source !== "api" &&
        input.source !== "ai"
      ) {
        throw new AppError({
          code: APP_ERROR_CODES.VALIDATION_ERROR,
          message: "Credit source must be web, API, or AI",
        });
      }

      if (!Number.isInteger(input.amount) || input.amount < 1) {
        throw new AppError({
          code: APP_ERROR_CODES.VALIDATION_ERROR,
          message: "Adjustment amount must be a positive integer",
        });
      }

      const email = await options.repository.findUserEmail(input.userId);

      if (email === undefined || email.length === 0) {
        throw new AppError({
          code: APP_ERROR_CODES.NOT_FOUND,
          message: "User not found",
        });
      }

      if (input.source === "api") {
        await ensureApiCreditBalance(input.userId);
      } else if (input.source === "ai") {
        await ensureAiCreditBalance(input.userId);
      } else {
        await ensureWebCreditBalance(input.userId);
      }

      const period =
        input.source === "api"
          ? (await resolveApiUsageContext(input.userId)).period
          : (await resolveUsageContext(input.userId)).period;

      await options.repository.applyManualCreditAdjustment({
        userId: input.userId,
        source: input.source,
        amount: input.amount,
        reason: `admin:${actorUserId}: ${reason}`,
        periodStart: period.start,
        periodEnd: period.end,
        now: now(),
      });
    },
  };
}
