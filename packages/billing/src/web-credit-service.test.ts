import { describe, expect, test } from "bun:test";
import { loadBillingConfig } from "@repo/config";
import { APP_ERROR_CODES, isAppError } from "@repo/core";
import { createBillingService } from "./billing-service.js";
import { createMemoryBillingRepository } from "./memory-billing-repository.js";
import type { PlanCatalog } from "./plan-types.js";

const now = new Date("2026-08-15T12:00:00.000Z");

function createCatalog(overrides?: Partial<PlanCatalog["free"]>): PlanCatalog {
  return {
    free: {
      monthlyConversions: 20,
      monthlyWebCredits: 100,
      storageBytes: 500 * 1024 * 1024,
      maxFileSizeBytes: 20 * 1024 * 1024,
      maxApiKeys: 2,
      apiAccess: true,
      authenticatedRequestsPerMinute: 60,
      apiRequestsPerMinute: 30,
      ...overrides,
    },
    pro: {
      monthlyConversions: 500,
      monthlyWebCredits: 2_000,
      storageBytes: 10 * 1024 * 1024 * 1024,
      maxFileSizeBytes: 100 * 1024 * 1024,
      maxApiKeys: 20,
      apiAccess: true,
      authenticatedRequestsPerMinute: 120,
      apiRequestsPerMinute: 60,
    },
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
  test("grants free monthly web credits once per UTC period", async () => {
    const billing = createService();
    const first = await billing.getWebCreditBalance("user_1");
    const second = await billing.getWebCreditBalance("user_1");

    expect(first.webCreditsGranted).toBe(100);
    expect(first.webCreditsUsed).toBe(0);
    expect(first.webCreditsRemaining).toBe(100);
    expect(second.webCreditsGranted).toBe(100);
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

  test("assertCanSpendWebCredits blocks before execution", async () => {
    const billing = createService({
      planCatalog: createCatalog({ monthlyWebCredits: 0 }),
    });

    try {
      await billing.assertCanSpendWebCredits({
        userId: "user_1",
        toolId: "pdf-to-jpg",
      });
      throw new Error("expected limit");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe(APP_ERROR_CODES.PLAN_LIMIT_REACHED);
      }
    }
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
