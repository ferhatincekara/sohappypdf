import { describe, expect, test } from "bun:test";
import {
  DEFAULT_API_STARTER_CREDITS,
  loadBillingConfig,
} from "@sohappypdf/config";
import { APP_ERROR_CODES, isAppError } from "@sohappypdf/core";
import { createBillingService } from "./billing-service.js";
import { INCLUDED_API_CREDITS_PER_MONTH } from "./default-plan-limits.js";
import { createMemoryBillingRepository } from "./memory-billing-repository.js";
import { DEFAULT_PLAN_LIMITS } from "./plan-config.js";
import { getUtcMonthPeriod } from "./usage-period.js";

const now = new Date("2026-08-15T12:00:00.000Z");
const period = getUtcMonthPeriod(now);
const toolId = "pdf-to-jpg";

function createService(options?: {
  repository?: ReturnType<typeof createMemoryBillingRepository>;
  env?: Record<string, string | undefined>;
  now?: Date;
  planCatalog?: Parameters<typeof createBillingService>[0]["planCatalog"];
}) {
  return createBillingService({
    repository: options?.repository ?? createMemoryBillingRepository(),
    config: loadBillingConfig({
      POLAR_API_STARTER_PRODUCT_ID: "prod_api_starter",
      ...options?.env,
    }),
    planCatalog: options?.planCatalog,
    now: () => options?.now ?? now,
  });
}

async function grantApiCredits(
  repository: ReturnType<typeof createMemoryBillingRepository>,
  amount: number,
) {
  await repository.grantApiCreditTopUp({
    userId: "user_1",
    periodStart: period.start,
    periodEnd: period.end,
    amount,
    providerEventId: `evt_grant_${amount}`,
    now,
  });
}

async function seedApiSubscription(
  repository: ReturnType<typeof createMemoryBillingRepository>,
) {
  await repository.upsertApiSubscription({
    userId: "user_1",
    polarSubscriptionId: "sub_api",
    polarProductId: "prod_api_starter",
    productKey: "starter",
    status: "active",
    cancelAtPeriodEnd: false,
    currentPeriodStart: period.start,
    currentPeriodEnd: period.end,
    endedAt: null,
    updatedAt: now,
  });
}

describe("API credits", () => {
  test("includes monthly API credits without an API pack", async () => {
    const repository = createMemoryBillingRepository();
    await repository.upsertSubscription({
      userId: "user_1",
      polarSubscriptionId: "sub_pro",
      polarProductId: "prod_pro",
      plan: "pro",
      status: "active",
      cancelAtPeriodEnd: false,
      currentPeriodStart: new Date("2026-08-01T00:00:00.000Z"),
      currentPeriodEnd: new Date("2026-09-01T00:00:00.000Z"),
      endedAt: null,
      updatedAt: now,
    });
    const billing = createService({ repository });
    const web = await billing.getWebCreditBalance("user_1");
    const api = await billing.getApiCreditBalance("user_1");

    expect(web.webCreditsGranted).toBeGreaterThan(0);
    expect(api.apiCreditsGranted).toBe(INCLUDED_API_CREDITS_PER_MONTH);
    expect(api.apiCreditsRemaining).toBe(INCLUDED_API_CREDITS_PER_MONTH);
  });

  test("grants recurring API credits from an active API subscription", async () => {
    const repository = createMemoryBillingRepository();
    await repository.upsertApiSubscription({
      userId: "user_1",
      polarSubscriptionId: "sub_api",
      polarProductId: "prod_api_starter",
      productKey: "starter",
      status: "active",
      cancelAtPeriodEnd: false,
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      endedAt: null,
      updatedAt: now,
    });
    const billing = createService({ repository });
    const balance = await billing.getApiCreditBalance("user_1");

    expect(balance.apiCreditsGranted).toBe(DEFAULT_API_STARTER_CREDITS);
    expect(balance.apiCreditsUsed).toBe(0);
  });

  test("does not keep granted API credits after the pack is revoked", async () => {
    const repository = createMemoryBillingRepository();
    await seedApiSubscription(repository);
    const billing = createService({ repository });
    await billing.getApiCreditBalance("user_1");
    await repository.upsertApiSubscription({
      userId: "user_1",
      polarSubscriptionId: "sub_api",
      polarProductId: "prod_api_starter",
      productKey: "starter",
      status: "revoked",
      cancelAtPeriodEnd: false,
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      endedAt: now,
      updatedAt: now,
    });

    const balance = await billing.getApiCreditBalance("user_1");
    expect(balance.apiCreditsGranted).toBe(INCLUDED_API_CREDITS_PER_MONTH);
    expect(balance.apiCreditsRemaining).toBe(INCLUDED_API_CREDITS_PER_MONTH);

    await billing.consumeApiCredits({
      userId: "user_1",
      conversionId: "11111111-1111-4111-8111-111111111111",
      toolId,
    });
    const after = await billing.getApiCreditBalance("user_1");
    expect(after.apiCreditsUsed).toBe(1);
    expect(after.apiCreditsRemaining).toBe(INCLUDED_API_CREDITS_PER_MONTH - 1);
  });

  test("uses the Polar payment day as the API credit period", async () => {
    const repository = createMemoryBillingRepository();
    const paidAt = new Date("2026-08-27T14:00:00.000Z");
    const current = new Date("2026-08-27T17:00:00.000Z");
    await repository.upsertApiSubscription({
      userId: "user_1",
      polarSubscriptionId: "sub_api",
      polarProductId: "prod_api_starter",
      productKey: "starter",
      status: "active",
      cancelAtPeriodEnd: false,
      currentPeriodStart: paidAt,
      currentPeriodEnd: new Date("2026-09-27T14:00:00.000Z"),
      endedAt: null,
      updatedAt: current,
    });
    const billing = createService({ repository, now: current });
    const status = await billing.getBillingStatus({
      userId: "user_1",
      storageUsedBytes: 0,
      apiKeyCount: 0,
    });

    expect(status.api.periodStart).toBe(paidAt.toISOString());
    expect(status.api.periodEnd).toBe("2026-09-27T14:00:00.000Z");
    expect(status.api.creditsLimit).toBe(DEFAULT_API_STARTER_CREDITS);
  });

  test("keeps admin API credits when a starter pack starts mid-month", async () => {
    const repository = createMemoryBillingRepository({
      userEmails: { user_1: "user@example.com" },
    });
    const billing = createService({ repository });
    await billing.getApiCreditBalance("user_1");
    await billing.adjustCredits({
      userId: "user_1",
      source: "api",
      amount: 750,
      reason: "support goodwill credit",
      actorUserId: "admin_1",
    });

    const before = await billing.getApiCreditBalance("user_1");
    expect(before.apiCreditsGranted).toBe(INCLUDED_API_CREDITS_PER_MONTH + 750);

    const current = new Date("2026-08-27T17:00:00.000Z");
    await repository.upsertApiSubscription({
      userId: "user_1",
      polarSubscriptionId: "sub_api",
      polarProductId: "prod_api_starter",
      productKey: "starter",
      status: "active",
      cancelAtPeriodEnd: false,
      currentPeriodStart: new Date("2026-08-27T14:00:00.000Z"),
      currentPeriodEnd: new Date("2026-09-27T14:00:00.000Z"),
      endedAt: null,
      updatedAt: current,
    });

    const after = await createService({
      repository,
      now: current,
    }).getApiCreditBalance("user_1");

    expect(after.apiCreditsGranted).toBe(DEFAULT_API_STARTER_CREDITS + 750);
    expect(after.apiCreditsRemaining).toBe(DEFAULT_API_STARTER_CREDITS + 750);
  });

  test("does not grant a second pack of credits when leaving the calendar-month bucket", async () => {
    const repository = createMemoryBillingRepository();
    const current = new Date("2026-08-27T17:00:00.000Z");
    await grantApiCredits(repository, DEFAULT_API_STARTER_CREDITS);
    await repository.upsertApiSubscription({
      userId: "user_1",
      polarSubscriptionId: "sub_api",
      polarProductId: "prod_api_starter",
      productKey: "starter",
      status: "active",
      cancelAtPeriodEnd: false,
      currentPeriodStart: new Date("2026-08-27T14:00:00.000Z"),
      currentPeriodEnd: new Date("2026-09-27T14:00:00.000Z"),
      endedAt: null,
      updatedAt: current,
    });
    const billing = createService({ repository, now: current });
    const balance = await billing.getApiCreditBalance("user_1");

    expect(balance.apiCreditsGranted).toBe(DEFAULT_API_STARTER_CREDITS);
    expect(balance.apiCreditsRemaining).toBe(DEFAULT_API_STARTER_CREDITS);
  });

  test("adds the credit difference when the API pack is upgraded in the same period", async () => {
    const repository = createMemoryBillingRepository();
    await repository.upsertApiSubscription({
      userId: "user_1",
      polarSubscriptionId: "sub_api",
      polarProductId: "prod_api_starter",
      productKey: "starter",
      status: "active",
      cancelAtPeriodEnd: false,
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      endedAt: null,
      updatedAt: now,
    });
    const billing = createService({
      repository,
      env: {
        POLAR_API_STARTER_PRODUCT_ID: "prod_api_starter",
        POLAR_API_GROWTH_PRODUCT_ID: "prod_api_growth",
      },
    });

    await billing.getApiCreditBalance("user_1");
    await repository.upsertApiSubscription({
      userId: "user_1",
      polarSubscriptionId: "sub_api",
      polarProductId: "prod_api_growth",
      productKey: "growth",
      status: "active",
      cancelAtPeriodEnd: false,
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      endedAt: null,
      updatedAt: now,
    });

    const upgraded = await billing.getApiCreditBalance("user_1");
    expect(upgraded.apiCreditsGranted).toBe(10_000);
    expect(upgraded.apiCreditsRemaining).toBe(10_000);
  });

  test("consumes API credits for a tool execution", async () => {
    const repository = createMemoryBillingRepository();
    await seedApiSubscription(repository);
    const billing = createService({ repository });

    await billing.consumeApiCredits({
      userId: "user_1",
      conversionId: "11111111-1111-4111-8111-111111111111",
      toolId,
    });

    const api = await billing.getApiCreditBalance("user_1");
    const web = await billing.getWebCreditBalance("user_1");
    expect(api.apiCreditsUsed).toBe(1);
    expect(api.apiCreditsRemaining).toBe(DEFAULT_API_STARTER_CREDITS - 1);
    expect(web.webCreditsUsed).toBe(0);
  });

  test("keeps web and API balances independent", async () => {
    const repository = createMemoryBillingRepository();
    await seedApiSubscription(repository);
    const billing = createService({
      repository,
      planCatalog: {
        free: {
          ...DEFAULT_PLAN_LIMITS.free,
          monthlyWebCredits: 10,
        },
        pro: DEFAULT_PLAN_LIMITS.pro,
      },
    });

    await billing.consumeWebCredits({
      userId: "user_1",
      conversionId: "11111111-1111-4111-8111-111111111111",
      toolId,
    });
    await billing.consumeApiCredits({
      userId: "user_1",
      conversionId: "22222222-2222-4222-8222-222222222222",
      toolId,
    });

    const web = await billing.getWebCreditBalance("user_1");
    const api = await billing.getApiCreditBalance("user_1");
    expect(web.webCreditsUsed).toBe(1);
    expect(api.apiCreditsUsed).toBe(1);
  });

  test("rejects consumption when API credits are insufficient", async () => {
    const repository = createMemoryBillingRepository();
    await seedApiSubscription(repository);
    const billing = createService({ repository });
    await billing.getApiCreditBalance("user_1");

    for (let index = 0; index < DEFAULT_API_STARTER_CREDITS; index += 1) {
      await billing.consumeApiCredits({
        userId: "user_1",
        conversionId: `11111111-1111-4111-8111-${String(index).padStart(12, "0")}`,
        toolId,
      });
    }

    try {
      await billing.consumeApiCredits({
        userId: "user_1",
        conversionId: "22222222-2222-4222-8222-222222222222",
        toolId,
      });
      throw new Error("expected insufficient balance");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe(APP_ERROR_CODES.PLAN_LIMIT_REACHED);
      }
    }
  });

  test("assertCanSpendApiCredits allows included credits before a pack", async () => {
    const billing = createService();

    await billing.assertCanSpendApiCredits({
      userId: "user_1",
      toolId,
    });
  });

  test("refunds consumed API credits", async () => {
    const repository = createMemoryBillingRepository();
    await seedApiSubscription(repository);
    const billing = createService({ repository });
    const conversionId = "11111111-1111-4111-8111-111111111111";

    await billing.consumeApiCredits({
      userId: "user_1",
      conversionId,
      toolId,
    });
    expect(
      await billing.refundApiCredits({
        userId: "user_1",
        conversionId,
        reason: "execution_failed",
      }),
    ).toBe(true);

    const balance = await billing.getApiCreditBalance("user_1");
    expect(balance.apiCreditsUsed).toBe(0);
    expect(balance.apiCreditsRemaining).toBe(DEFAULT_API_STARTER_CREDITS);
  });

  test("handles concurrent API consumption safely", async () => {
    const repository = createMemoryBillingRepository();
    await seedApiSubscription(repository);
    const billing = createService({ repository });
    await billing.getApiCreditBalance("user_1");

    for (let index = 0; index < DEFAULT_API_STARTER_CREDITS - 1; index += 1) {
      await billing.consumeApiCredits({
        userId: "user_1",
        conversionId: `11111111-1111-4111-8111-${String(index).padStart(12, "0")}`,
        toolId,
      });
    }

    const results = await Promise.allSettled([
      billing.consumeApiCredits({
        userId: "user_1",
        conversionId: "11111111-1111-4111-8111-aaaaaaaaaaa1",
        toolId,
      }),
      billing.consumeApiCredits({
        userId: "user_1",
        conversionId: "22222222-2222-4222-8222-bbbbbbbbbbb2",
        toolId,
      }),
    ]);

    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const balance = await billing.getApiCreditBalance("user_1");
    expect(balance.apiCreditsUsed).toBe(DEFAULT_API_STARTER_CREDITS);
    expect(balance.apiCreditsRemaining).toBe(0);
  });

  test("shows only the current period in recent API usage", async () => {
    const repository = createMemoryBillingRepository();
    const previous = getUtcMonthPeriod(new Date("2026-07-15T12:00:00.000Z"));
    await repository.grantApiCreditTopUp({
      userId: "user_1",
      periodStart: previous.start,
      periodEnd: previous.end,
      amount: 50,
      providerEventId: "evt_previous_grant",
      now: previous.start,
    });
    await repository.consumeApiCredits({
      userId: "user_1",
      periodStart: previous.start,
      periodEnd: previous.end,
      amount: 8,
      toolId,
      executionId: "11111111-1111-4111-8111-previous0001",
      reason: "tool_execution",
      now: previous.start,
    });
    await grantApiCredits(repository, DEFAULT_API_STARTER_CREDITS);
    await repository.consumeApiCredits({
      userId: "user_1",
      periodStart: period.start,
      periodEnd: period.end,
      amount: 3,
      toolId,
      executionId: "11111111-1111-4111-8111-current00001",
      reason: "tool_execution",
      now,
    });
    const billing = createService({ repository });
    const status = await billing.getBillingStatus({
      userId: "user_1",
      storageUsedBytes: 0,
      apiKeyCount: 0,
    });

    expect(
      status.api.recentUsage.some(
        (entry) => entry.type === "consume" && entry.amount === 3,
      ),
    ).toBe(true);
    expect(status.api.recentUsage.some((entry) => entry.amount === 8)).toBe(
      false,
    );
    expect(status.api.recentUsage.some((entry) => entry.amount === 50)).toBe(
      false,
    );
  });
});
