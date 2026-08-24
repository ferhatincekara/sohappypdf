import { APP_ERROR_CODES, AppError } from "@repo/core";
import type { BillingRepository } from "./billing-repository.js";
import type {
  BillingCustomerRecord,
  BillingSubscriptionRecord,
  WebCreditBalance,
} from "./billing-types.js";

type UsageRecord = {
  conversionsUsed: number;
  webCreditsGranted: number;
  webCreditsUsed: number;
};

type LedgerEntry = {
  userId: string;
  amount: number;
  type: "grant" | "consume" | "refund" | "adjustment";
  source: "web" | "api" | "ai";
  reason: string;
  toolId?: string;
  executionId?: string;
  periodStart: Date;
  createdAt: Date;
};

export function createMemoryBillingRepository(options?: {
  userEmails?: Record<string, string>;
}): BillingRepository {
  const customers = new Map<string, BillingCustomerRecord>();
  const customersByPolarId = new Map<string, BillingCustomerRecord>();
  const subscriptions = new Map<string, BillingSubscriptionRecord>();
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

  function hasGrant(userId: string, periodStart: Date): boolean {
    return ledger.some(
      (entry) =>
        entry.userId === userId &&
        entry.type === "grant" &&
        entry.source === "web" &&
        entry.periodStart.getTime() === periodStart.getTime(),
    );
  }

  function findConsumeEntry(executionId: string): LedgerEntry | undefined {
    return ledger.find(
      (entry) => entry.type === "consume" && entry.executionId === executionId,
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

    async getOrCreateUsagePeriod(input) {
      const record = getUsageRecord(input.userId, input.periodStart);
      return { ...record };
    },

    async ensureWebCreditGrant(input) {
      const record = getUsageRecord(input.userId, input.periodStart);

      if (!hasGrant(input.userId, input.periodStart)) {
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
            entry.type === "consume" && entry.executionId === input.executionId,
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
      const consumeEntry = findConsumeEntry(input.executionId);

      if (consumeEntry === undefined) {
        return false;
      }

      if (
        ledger.some(
          (entry) =>
            entry.type === "refund" && entry.executionId === input.executionId,
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

      return true;
    },
  };
}
