import { APP_ERROR_CODES, AppError } from "@repo/core";
import type { BillingRepository } from "./billing-repository.js";
import type {
  AiCreditBalance,
  ApiCreditBalance,
  ApiSubscriptionRecord,
  BillingCustomerRecord,
  BillingSubscriptionRecord,
  WebCreditBalance,
} from "./billing-types.js";

type UsageRecord = {
  conversionsUsed: number;
  webCreditsGranted: number;
  webCreditsUsed: number;
  aiCreditsGranted: number;
  aiCreditsUsed: number;
  apiCreditsGranted: number;
  apiCreditsUsed: number;
};

type LedgerEntry = {
  userId: string;
  amount: number;
  type: "grant" | "consume" | "refund" | "adjustment";
  source: "web" | "api" | "ai";
  reason: string;
  toolId?: string;
  executionId?: string;
  providerEventId?: string;
  periodStart: Date;
  createdAt: Date;
};

export function createMemoryBillingRepository(options?: {
  userEmails?: Record<string, string>;
}): BillingRepository {
  const customers = new Map<string, BillingCustomerRecord>();
  const customersByPolarId = new Map<string, BillingCustomerRecord>();
  const subscriptions = new Map<string, BillingSubscriptionRecord>();
  const apiSubscriptions = new Map<string, ApiSubscriptionRecord>();
  const usage = new Map<string, UsageRecord>();
  const conversionEvents = new Set<string>();
  const ledger: LedgerEntry[] = [];
  const webhookIds = new Set<string>();
  const userEmails = options?.userEmails ?? {};

  function usageKey(userId: string, periodStart: Date): string {
    return `${userId}:${periodStart.toISOString()}`;
  }

  function webhookKey(provider: string, eventId: string): string {
    return `${provider}:${eventId}`;
  }

  function getUsageRecord(userId: string, periodStart: Date): UsageRecord {
    const key = usageKey(userId, periodStart);
    const existing = usage.get(key);

    if (existing !== undefined) {
      return existing;
    }

    const created = {
      conversionsUsed: 0,
      webCreditsGranted: 0,
      webCreditsUsed: 0,
      aiCreditsGranted: 0,
      aiCreditsUsed: 0,
      apiCreditsGranted: 0,
      apiCreditsUsed: 0,
    };
    usage.set(key, created);
    return created;
  }

  function toBalance(record: UsageRecord): WebCreditBalance {
    return {
      webCreditsGranted: record.webCreditsGranted,
      webCreditsUsed: record.webCreditsUsed,
      webCreditsRemaining: record.webCreditsGranted - record.webCreditsUsed,
    };
  }

  function toAiBalance(record: UsageRecord): AiCreditBalance {
    return {
      aiCreditsGranted: record.aiCreditsGranted,
      aiCreditsUsed: record.aiCreditsUsed,
      aiCreditsRemaining: record.aiCreditsGranted - record.aiCreditsUsed,
    };
  }

  function toApiBalance(record: UsageRecord): ApiCreditBalance {
    return {
      apiCreditsGranted: record.apiCreditsGranted,
      apiCreditsUsed: record.apiCreditsUsed,
      apiCreditsRemaining: record.apiCreditsGranted - record.apiCreditsUsed,
    };
  }

  function hasGrant(
    userId: string,
    periodStart: Date,
    source: LedgerEntry["source"],
  ): boolean {
    return ledger.some(
      (entry) =>
        entry.userId === userId &&
        entry.type === "grant" &&
        entry.source === source &&
        entry.periodStart.getTime() === periodStart.getTime(),
    );
  }

  function findConsumeEntry(
    executionId: string,
    source: LedgerEntry["source"],
  ): LedgerEntry | undefined {
    return ledger.find(
      (entry) =>
        entry.type === "consume" &&
        entry.source === source &&
        entry.executionId === executionId,
    );
  }

  return {
    async findCustomerByUserId(userId) {
      const row = customers.get(userId);
      return row === undefined ? undefined : { ...row };
    },

    async findCustomerByPolarId(polarCustomerId) {
      const row = customersByPolarId.get(polarCustomerId);
      return row === undefined ? undefined : { ...row };
    },

    async upsertCustomer(record) {
      const stored = { ...record };
      customers.set(record.userId, stored);
      customersByPolarId.set(record.polarCustomerId, stored);
      return { ...stored };
    },

    async findLatestSubscriptionByUserId(userId) {
      const matches = [...subscriptions.values()]
        .filter((item) => item.userId === userId)
        .sort(
          (left, right) => right.updatedAt.getTime() - left.updatedAt.getTime(),
        );

      return matches[0] === undefined ? undefined : { ...matches[0] };
    },

    async upsertSubscription(record) {
      const existing = [...subscriptions.values()].find(
        (item) => item.polarSubscriptionId === record.polarSubscriptionId,
      );
      const stored: BillingSubscriptionRecord = {
        id: record.id ?? existing?.id ?? `sub_${subscriptions.size + 1}`,
        createdAt: record.createdAt ?? existing?.createdAt ?? record.updatedAt,
        userId: record.userId,
        polarSubscriptionId: record.polarSubscriptionId,
        polarProductId: record.polarProductId,
        plan: record.plan,
        status: record.status,
        cancelAtPeriodEnd: record.cancelAtPeriodEnd,
        currentPeriodStart: record.currentPeriodStart,
        currentPeriodEnd: record.currentPeriodEnd,
        endedAt: record.endedAt,
        updatedAt: record.updatedAt,
      };
      subscriptions.set(stored.polarSubscriptionId, stored);
      return { ...stored };
    },

    async findLatestApiSubscriptionByUserId(userId) {
      const matches = [...apiSubscriptions.values()]
        .filter((item) => item.userId === userId)
        .sort(
          (left, right) => right.updatedAt.getTime() - left.updatedAt.getTime(),
        );

      return matches[0] === undefined ? undefined : { ...matches[0] };
    },

    async listApiSubscriptionsByUserId(userId) {
      return [...apiSubscriptions.values()]
        .filter((item) => item.userId === userId)
        .sort(
          (left, right) => right.updatedAt.getTime() - left.updatedAt.getTime(),
        )
        .map((item) => ({ ...item }));
    },

    async upsertApiSubscription(record) {
      const existing = [...apiSubscriptions.values()].find(
        (item) => item.polarSubscriptionId === record.polarSubscriptionId,
      );
      const stored: ApiSubscriptionRecord = {
        id: record.id ?? existing?.id ?? `api_sub_${apiSubscriptions.size + 1}`,
        createdAt: record.createdAt ?? existing?.createdAt ?? record.updatedAt,
        userId: record.userId,
        polarSubscriptionId: record.polarSubscriptionId,
        polarProductId: record.polarProductId,
        productKey: record.productKey,
        status: record.status,
        cancelAtPeriodEnd: record.cancelAtPeriodEnd,
        currentPeriodStart: record.currentPeriodStart,
        currentPeriodEnd: record.currentPeriodEnd,
        endedAt: record.endedAt,
        updatedAt: record.updatedAt,
      };
      apiSubscriptions.set(stored.polarSubscriptionId, stored);
      return { ...stored };
    },

    async getOrCreateUsagePeriod(input) {
      const record = getUsageRecord(input.userId, input.periodStart);
      return { ...record };
    },

    async ensureWebCreditGrant(input) {
      const record = getUsageRecord(input.userId, input.periodStart);

      if (!hasGrant(input.userId, input.periodStart, "web")) {
        ledger.push({
          userId: input.userId,
          amount: input.grantAmount,
          type: "grant",
          source: "web",
          reason: "monthly_plan_grant",
          periodStart: input.periodStart,
          createdAt: input.now,
        });
        record.webCreditsGranted = input.grantAmount;
      }

      return toBalance(record);
    },

    async consumeWebCredits(input) {
      if (
        ledger.some(
          (entry) =>
            entry.type === "consume" &&
            entry.source === "web" &&
            entry.executionId === input.executionId,
        )
      ) {
        return false;
      }

      const record = getUsageRecord(input.userId, input.periodStart);

      if (record.webCreditsUsed + input.amount > record.webCreditsGranted) {
        throw new AppError({
          code: APP_ERROR_CODES.PLAN_LIMIT_REACHED,
          message: "Monthly web tool credit limit reached",
        });
      }

      ledger.push({
        userId: input.userId,
        amount: input.amount,
        type: "consume",
        source: "web",
        reason: input.reason,
        toolId: input.toolId,
        executionId: input.executionId,
        periodStart: input.periodStart,
        createdAt: input.now,
      });
      record.webCreditsUsed += input.amount;
      return true;
    },

    async refundWebCredits(input) {
      const consumeEntry = findConsumeEntry(input.executionId, "web");

      if (consumeEntry === undefined) {
        return false;
      }

      if (
        ledger.some(
          (entry) =>
            entry.type === "refund" &&
            entry.source === "web" &&
            entry.executionId === input.executionId,
        )
      ) {
        return false;
      }

      const record = getUsageRecord(input.userId, consumeEntry.periodStart);
      ledger.push({
        userId: input.userId,
        amount: consumeEntry.amount,
        type: "refund",
        source: "web",
        reason: input.reason,
        executionId: input.executionId,
        periodStart: consumeEntry.periodStart,
        createdAt: input.now,
      });
      record.webCreditsUsed = Math.max(
        0,
        record.webCreditsUsed - consumeEntry.amount,
      );
      return true;
    },

    async ensureAiCreditGrant(input) {
      const record = getUsageRecord(input.userId, input.periodStart);

      if (
        input.grantAmount > 0 &&
        !hasGrant(input.userId, input.periodStart, "ai")
      ) {
        ledger.push({
          userId: input.userId,
          amount: input.grantAmount,
          type: "grant",
          source: "ai",
          reason: "monthly_plan_grant",
          periodStart: input.periodStart,
          createdAt: input.now,
        });
        record.aiCreditsGranted = input.grantAmount;
      }

      return toAiBalance(record);
    },

    async consumeAiCredits(input) {
      if (
        ledger.some(
          (entry) =>
            entry.type === "consume" &&
            entry.source === "ai" &&
            entry.executionId === input.executionId,
        )
      ) {
        return false;
      }

      const record = getUsageRecord(input.userId, input.periodStart);

      if (record.aiCreditsUsed + input.amount > record.aiCreditsGranted) {
        throw new AppError({
          code: APP_ERROR_CODES.PLAN_LIMIT_REACHED,
          message: "Monthly AI credit limit reached",
        });
      }

      ledger.push({
        userId: input.userId,
        amount: input.amount,
        type: "consume",
        source: "ai",
        reason: input.reason,
        toolId: input.toolId,
        executionId: input.executionId,
        periodStart: input.periodStart,
        createdAt: input.now,
      });
      record.aiCreditsUsed += input.amount;
      return true;
    },

    async refundAiCredits(input) {
      const consumeEntry = findConsumeEntry(input.executionId, "ai");

      if (consumeEntry === undefined) {
        return false;
      }

      if (
        ledger.some(
          (entry) =>
            entry.type === "refund" &&
            entry.source === "ai" &&
            entry.executionId === input.executionId,
        )
      ) {
        return false;
      }

      const record = getUsageRecord(input.userId, consumeEntry.periodStart);
      ledger.push({
        userId: input.userId,
        amount: consumeEntry.amount,
        type: "refund",
        source: "ai",
        reason: input.reason,
        executionId: input.executionId,
        periodStart: consumeEntry.periodStart,
        createdAt: input.now,
      });
      record.aiCreditsUsed = Math.max(
        0,
        record.aiCreditsUsed - consumeEntry.amount,
      );
      return true;
    },

    async ensureApiCreditGrant(input) {
      const record = getUsageRecord(input.userId, input.periodStart);

      if (
        input.grantAmount > 0 &&
        !hasGrant(input.userId, input.periodStart, "api")
      ) {
        ledger.push({
          userId: input.userId,
          amount: input.grantAmount,
          type: "grant",
          source: "api",
          reason: "monthly_plan_grant",
          periodStart: input.periodStart,
          createdAt: input.now,
        });
        record.apiCreditsGranted += input.grantAmount;
      }

      return toApiBalance(record);
    },

    async consumeApiCredits(input) {
      if (
        ledger.some(
          (entry) =>
            entry.type === "consume" && entry.executionId === input.executionId,
        )
      ) {
        return false;
      }

      const record = getUsageRecord(input.userId, input.periodStart);

      if (record.apiCreditsUsed + input.amount > record.apiCreditsGranted) {
        throw new AppError({
          code: APP_ERROR_CODES.PLAN_LIMIT_REACHED,
          message: "API credit limit reached",
        });
      }

      ledger.push({
        userId: input.userId,
        amount: input.amount,
        type: "consume",
        source: "api",
        reason: input.reason,
        toolId: input.toolId,
        executionId: input.executionId,
        periodStart: input.periodStart,
        createdAt: input.now,
      });
      record.apiCreditsUsed += input.amount;
      return true;
    },

    async refundApiCredits(input) {
      const consumeEntry = findConsumeEntry(input.executionId, "api");

      if (consumeEntry === undefined) {
        return false;
      }

      if (
        ledger.some(
          (entry) =>
            entry.type === "refund" &&
            entry.source === "api" &&
            entry.executionId === input.executionId,
        )
      ) {
        return false;
      }

      const record = getUsageRecord(input.userId, consumeEntry.periodStart);
      ledger.push({
        userId: input.userId,
        amount: consumeEntry.amount,
        type: "refund",
        source: "api",
        reason: input.reason,
        executionId: input.executionId,
        periodStart: consumeEntry.periodStart,
        createdAt: input.now,
      });
      record.apiCreditsUsed = Math.max(
        0,
        record.apiCreditsUsed - consumeEntry.amount,
      );
      return true;
    },

    async grantApiCreditTopUp(input) {
      if (
        ledger.some((entry) => entry.providerEventId === input.providerEventId)
      ) {
        return false;
      }

      const record = getUsageRecord(input.userId, input.periodStart);
      ledger.push({
        userId: input.userId,
        amount: input.amount,
        type: "adjustment",
        source: "api",
        reason: "polar_topup",
        providerEventId: input.providerEventId,
        periodStart: input.periodStart,
        createdAt: input.now,
      });
      record.apiCreditsGranted += input.amount;
      return true;
    },

    async listApiCreditLedger(input) {
      return ledger
        .filter(
          (entry) => entry.userId === input.userId && entry.source === "api",
        )
        .sort(
          (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
        )
        .slice(0, input.limit)
        .map((entry) => ({
          amount: entry.amount,
          type: entry.type,
          toolId: entry.toolId ?? null,
          createdAt: entry.createdAt.toISOString(),
        }));
    },

    async recordConversionUsage(input) {
      if (conversionEvents.has(input.conversionId)) {
        return false;
      }

      conversionEvents.add(input.conversionId);
      const record = getUsageRecord(input.userId, input.periodStart);
      record.conversionsUsed += 1;
      return true;
    },

    async findUserEmail(userId) {
      return userEmails[userId];
    },

    async applySubscriptionWebhook(input) {
      const key = webhookKey(input.provider, input.eventId);

      if (webhookIds.has(key)) {
        return false;
      }

      webhookIds.add(key);

      if (input.customer !== undefined) {
        await this.upsertCustomer({
          userId: input.customer.userId,
          polarCustomerId: input.customer.polarCustomerId,
          createdAt: input.processedAt,
          updatedAt: input.processedAt,
        });
      }

      if (input.subscription !== undefined) {
        await this.upsertSubscription(input.subscription);
      }

      if (input.apiSubscription !== undefined) {
        await this.upsertApiSubscription(input.apiSubscription);
      }

      if (input.apiCreditTopUp !== undefined) {
        await this.grantApiCreditTopUp({
          userId: input.apiCreditTopUp.userId,
          periodStart: input.apiCreditTopUp.periodStart,
          periodEnd: input.apiCreditTopUp.periodEnd,
          amount: input.apiCreditTopUp.amount,
          providerEventId: input.eventId,
          now: input.processedAt,
        });
      }

      return true;
    },
  };
}
