import type { BillingRepository } from "./billing-repository.js";
import type {
  BillingCustomerRecord,
  BillingSubscriptionRecord,
} from "./billing-types.js";

export function createMemoryBillingRepository(options?: {
  userEmails?: Record<string, string>;
}): BillingRepository {
  const customers = new Map<string, BillingCustomerRecord>();
  const customersByPolarId = new Map<string, BillingCustomerRecord>();
  const subscriptions = new Map<string, BillingSubscriptionRecord>();
  const usage = new Map<string, { conversionsUsed: number }>();
  const conversionEvents = new Set<string>();
  const webhookIds = new Set<string>();
  const userEmails = options?.userEmails ?? {};

  function usageKey(userId: string, periodStart: Date): string {
    return `${userId}:${periodStart.toISOString()}`;
  }

  function webhookKey(provider: string, eventId: string): string {
    return `${provider}:${eventId}`;
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
      const key = usageKey(input.userId, input.periodStart);
      const existing = usage.get(key);

      if (existing !== undefined) {
        return { conversionsUsed: existing.conversionsUsed };
      }

      usage.set(key, { conversionsUsed: 0 });
      return { conversionsUsed: 0 };
    },

    async recordConversionUsage(input) {
      if (conversionEvents.has(input.conversionId)) {
        return false;
      }

      conversionEvents.add(input.conversionId);
      const key = usageKey(input.userId, input.periodStart);
      const existing = usage.get(key) ?? { conversionsUsed: 0 };
      usage.set(key, { conversionsUsed: existing.conversionsUsed + 1 });
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
