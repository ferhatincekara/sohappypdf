import { describe, expect, test } from "bun:test";
import { loadBillingConfig } from "@repo/config";
import { APP_ERROR_CODES, isAppError } from "@repo/core";
import { createBillingService } from "./billing-service.js";
import { createMemoryBillingRepository } from "./memory-billing-repository.js";
import { getUtcMonthPeriod } from "./usage-period.js";

const now = new Date("2026-08-15T12:00:00.000Z");
const period = getUtcMonthPeriod(now);
const toolId = "pdf-to-jpg";

function createService(options?: {
  repository?: ReturnType<typeof createMemoryBillingRepository>;
  env?: Record<string, string | undefined>;
}) {
  return createBillingService({
    repository: options?.repository ?? createMemoryBillingRepository(),
    config: loadBillingConfig({
      POLAR_API_STARTER_PRODUCT_ID: "prod_api_starter",
      POLAR_API_CREDIT_PACKS: "prod_pack:500",
      ...options?.env,
    }),
    now: () => now,
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

describe("API credits", () => {
  test("does not grant API credits from the web Free or Pro plan", async () => {
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
    expect(api.apiCreditsGranted).toBe(0);
    expect(api.apiCreditsRemaining).toBe(0);
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

    expect(balance.apiCreditsGranted).toBe(1_000);
    expect(balance.apiCreditsUsed).toBe(0);
  });

  test("consumes API credits for a tool execution", async () => {
    const repository = createMemoryBillingRepository();
    await grantApiCredits(repository, 10);
    const billing = createService({ repository });

    await billing.consumeApiCredits({
      userId: "user_1",
      conversionId: "11111111-1111-4111-8111-111111111111",
      toolId,
    });

    const api = await billing.getApiCreditBalance("user_1");
    const web = await billing.getWebCreditBalance("user_1");
    expect(api.apiCreditsUsed).toBe(1);
    expect(api.apiCreditsRemaining).toBe(9);
    expect(web.webCreditsUsed).toBe(0);
  });

  test("keeps web and API balances independent", async () => {
    const repository = createMemoryBillingRepository();
    await grantApiCredits(repository, 10);
    const billing = createService({ repository });

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
    await grantApiCredits(repository, 1);
    const billing = createService({ repository });

    await billing.consumeApiCredits({
      userId: "user_1",
      conversionId: "11111111-1111-4111-8111-111111111111",
      toolId,
    });

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

  test("assertCanSpendApiCredits blocks before execution", async () => {
    const billing = createService();

    try {
      await billing.assertCanSpendApiCredits({
        userId: "user_1",
        toolId,
      });
      throw new Error("expected limit");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe(APP_ERROR_CODES.PLAN_LIMIT_REACHED);
      }
    }
  });

  test("refunds consumed API credits", async () => {
    const repository = createMemoryBillingRepository();
    await grantApiCredits(repository, 10);
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
    expect(balance.apiCreditsRemaining).toBe(10);
  });

  test("handles concurrent API consumption safely", async () => {
    const repository = createMemoryBillingRepository();
    await grantApiCredits(repository, 1);
    const billing = createService({ repository });

    const results = await Promise.allSettled([
      billing.consumeApiCredits({
        userId: "user_1",
        conversionId: "11111111-1111-4111-8111-111111111111",
        toolId,
      }),
      billing.consumeApiCredits({
        userId: "user_1",
        conversionId: "22222222-2222-4222-8222-222222222222",
        toolId,
      }),
    ]);

    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const balance = await billing.getApiCreditBalance("user_1");
    expect(balance.apiCreditsUsed).toBe(1);
    expect(balance.apiCreditsRemaining).toBe(0);
  });
});
