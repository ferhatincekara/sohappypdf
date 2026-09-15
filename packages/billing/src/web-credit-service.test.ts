import { describe, expect, test } from "bun:test";
import { loadBillingConfig } from "@sohappypdf/config";
import { APP_ERROR_CODES, isAppError } from "@sohappypdf/core";
import { createBillingService } from "./billing-service.js";
import { createMemoryBillingRepository } from "./memory-billing-repository.js";
import { DEFAULT_PLAN_LIMITS } from "./plan-config.js";
import type { PlanCatalog } from "./plan-types.js";

const now = new Date("2026-08-15T12:00:00.000Z");

function createCatalog(overrides?: Partial<PlanCatalog["free"]>): PlanCatalog {
  return {
    free: {
      ...DEFAULT_PLAN_LIMITS.free,
      ...overrides,
    },
    pro: DEFAULT_PLAN_LIMITS.pro,
  };
}

function createService(options?: {
  repository?: ReturnType<typeof createMemoryBillingRepository>;
  planCatalog?: PlanCatalog;
}) {
  return createBillingService({
    repository: options?.repository ?? createMemoryBillingRepository(),
    config: loadBillingConfig({}),
    planCatalog: options?.planCatalog ?? createCatalog(),
    now: () => now,
  });
}

describe("web tool credits", () => {
  test("does not grant monthly web credits when free usage is daily-only", async () => {
    const billing = createService();
    const first = await billing.getWebCreditBalance("user_1");
    const second = await billing.getWebCreditBalance("user_1");

    expect(first.webCreditsGranted).toBe(0);
    expect(first.webCreditsUsed).toBe(0);
    expect(first.webCreditsRemaining).toBe(0);
    expect(second.webCreditsGranted).toBe(0);
  });

  test("grants pro monthly web credits for the subscription period", async () => {
    const repository = createMemoryBillingRepository();
    await repository.upsertSubscription({
      userId: "user_1",
      polarSubscriptionId: "sub_1",
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
    const balance = await billing.getWebCreditBalance("user_1");
    const status = await billing.getBillingStatus({
      userId: "user_1",
      storageUsedBytes: 0,
      apiKeyCount: 0,
    });

    expect(balance.webCreditsGranted).toBe(2_000);
    expect(status.usage.periodStart).toBe("2026-08-01T00:00:00.000Z");
    expect(status.usage.periodEnd).toBe("2026-09-01T00:00:00.000Z");
  });

  test("consumes credits for a tool execution", async () => {
    const billing = createService({
      planCatalog: createCatalog({ monthlyWebCredits: 10 }),
    });

    await billing.consumeWebCredits({
      userId: "user_1",
      conversionId: "11111111-1111-4111-8111-111111111111",
      toolId: "pdf-to-jpg",
    });

    const balance = await billing.getWebCreditBalance("user_1");
    expect(balance.webCreditsUsed).toBe(1);
    expect(balance.webCreditsRemaining).toBe(9);
  });

  test("consumes credits idempotently by conversion id", async () => {
    const billing = createService({
      planCatalog: createCatalog({ monthlyWebCredits: 10 }),
    });

    expect(
      await billing.consumeWebCredits({
        userId: "user_1",
        conversionId: "11111111-1111-4111-8111-111111111111",
        toolId: "pdf-to-jpg",
      }),
    ).toBe(true);
    expect(
      await billing.consumeWebCredits({
        userId: "user_1",
        conversionId: "11111111-1111-4111-8111-111111111111",
        toolId: "pdf-to-jpg",
      }),
    ).toBe(false);

    const balance = await billing.getWebCreditBalance("user_1");
    expect(balance.webCreditsUsed).toBe(1);
  });

  test("refunds consumed credits", async () => {
    const billing = createService({
      planCatalog: createCatalog({ monthlyWebCredits: 10 }),
    });
    const conversionId = "11111111-1111-4111-8111-111111111111";

    await billing.consumeWebCredits({
      userId: "user_1",
      conversionId,
      toolId: "pdf-to-jpg",
    });
    expect(
      await billing.refundWebCredits({
        userId: "user_1",
        conversionId,
        reason: "execution_failed",
      }),
    ).toBe(true);

    const balance = await billing.getWebCreditBalance("user_1");
    expect(balance.webCreditsUsed).toBe(0);
    expect(balance.webCreditsRemaining).toBe(10);
  });

  test("refunds infrastructure failures only once", async () => {
    const billing = createService({
      planCatalog: createCatalog({ monthlyWebCredits: 10 }),
    });
    const conversionId = "22222222-2222-4222-8222-222222222222";

    await billing.consumeWebCredits({
      userId: "user_1",
      conversionId,
      toolId: "pdf-to-jpg",
    });

    expect(
      await billing.refundWebCreditsForFailure({
        userId: "user_1",
        conversionId,
        errorCode: "processing_failed",
      }),
    ).toBe(true);
    expect(
      await billing.refundWebCreditsForFailure({
        userId: "user_1",
        conversionId,
        errorCode: "processing_failed",
      }),
    ).toBe(false);
    expect(
      await billing.refundWebCreditsForFailure({
        userId: "user_1",
        conversionId: "33333333-3333-4333-8333-333333333333",
        errorCode: "unsupported_conversion",
      }),
    ).toBe(false);
  });

  test("rejects consumption when balance is insufficient", async () => {
    const billing = createService({
      planCatalog: createCatalog({ monthlyWebCredits: 1 }),
    });

    await billing.consumeWebCredits({
      userId: "user_1",
      conversionId: "11111111-1111-4111-8111-111111111111",
      toolId: "pdf-to-jpg",
    });

    try {
      await billing.consumeWebCredits({
        userId: "user_1",
        conversionId: "22222222-2222-4222-8222-222222222222",
        toolId: "pdf-to-jpg",
      });
      throw new Error("expected insufficient balance");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe(APP_ERROR_CODES.PLAN_LIMIT_REACHED);
      }
    }
  });

  test("assertCanSpendWebCredits skips the monthly meter when credits are unused", async () => {
    const billing = createService({
      planCatalog: createCatalog({ monthlyWebCredits: 0 }),
    });

    await billing.assertCanSpendWebCredits({
      userId: "user_1",
      toolId: "pdf-to-jpg",
    });
  });

  test("handles concurrent consumption safely", async () => {
    const billing = createService({
      planCatalog: createCatalog({ monthlyWebCredits: 1 }),
    });

    const results = await Promise.allSettled([
      billing.consumeWebCredits({
        userId: "user_1",
        conversionId: "11111111-1111-4111-8111-111111111111",
        toolId: "pdf-to-jpg",
      }),
      billing.consumeWebCredits({
        userId: "user_1",
        conversionId: "22222222-2222-4222-8222-222222222222",
        toolId: "pdf-to-jpg",
      }),
    ]);

    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const balance = await billing.getWebCreditBalance("user_1");
    expect(balance.webCreditsUsed).toBe(1);
    expect(balance.webCreditsRemaining).toBe(0);
  });
});
