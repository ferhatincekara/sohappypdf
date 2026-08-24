import { describe, expect, test } from "bun:test";
import { loadBillingConfig } from "@repo/config";
import { APP_ERROR_CODES, isAppError } from "@repo/core";
import { createBillingService } from "./billing-service.js";
import { createMemoryBillingRepository } from "./memory-billing-repository.js";
import type { PlanCatalog } from "./plan-types.js";

const now = new Date("2026-08-15T12:00:00.000Z");
const aiToolId = "ai-summarizer";

function createCatalog(overrides?: Partial<PlanCatalog["free"]>): PlanCatalog {
  return {
    free: {
      monthlyConversions: 20,
      monthlyWebCredits: 100,
      monthlyAiCredits: 100,
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
      monthlyAiCredits: 200,
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

describe("AI credits", () => {
  test("grants free monthly AI credits once per UTC period", async () => {
    const billing = createService();
    const first = await billing.getAiCreditBalance("user_1");
    const second = await billing.getAiCreditBalance("user_1");

    expect(first.aiCreditsGranted).toBe(100);
    expect(first.aiCreditsUsed).toBe(0);
    expect(first.aiCreditsRemaining).toBe(100);
    expect(second.aiCreditsGranted).toBe(100);
  });

  test("grants pro monthly AI credits for the subscription period", async () => {
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
    const balance = await billing.getAiCreditBalance("user_1");
    const status = await billing.getBillingStatus({
      userId: "user_1",
      storageUsedBytes: 0,
      apiKeyCount: 0,
    });

    expect(balance.aiCreditsGranted).toBe(200);
    expect(status.usage.aiCreditsLimit).toBe(200);
    expect(status.usage.aiCreditsRemaining).toBe(200);
    expect(status.usage.periodStart).toBe("2026-08-01T00:00:00.000Z");
    expect(status.usage.periodEnd).toBe("2026-09-01T00:00:00.000Z");
  });

  test("consumes and refunds AI credits without touching web credits", async () => {
    const billing = createService({
      planCatalog: createCatalog({
        monthlyWebCredits: 50,
        monthlyAiCredits: 30,
      }),
    });
    const conversionId = "11111111-1111-4111-8111-111111111111";

    await billing.getWebCreditBalance("user_1");
    await billing.getAiCreditBalance("user_1");

    await billing.consumeAiCredits({
      userId: "user_1",
      conversionId,
      toolId: aiToolId,
    });

    const aiAfterConsume = await billing.getAiCreditBalance("user_1");
    const webAfterAiConsume = await billing.getWebCreditBalance("user_1");

    expect(aiAfterConsume.aiCreditsUsed).toBe(10);
    expect(aiAfterConsume.aiCreditsRemaining).toBe(20);
    expect(webAfterAiConsume.webCreditsUsed).toBe(0);
    expect(webAfterAiConsume.webCreditsRemaining).toBe(50);

    expect(
      await billing.refundAiCredits({
        userId: "user_1",
        conversionId,
        reason: "execution_failed",
      }),
    ).toBe(true);

    const aiAfterRefund = await billing.getAiCreditBalance("user_1");
    const webAfterRefund = await billing.getWebCreditBalance("user_1");

    expect(aiAfterRefund.aiCreditsUsed).toBe(0);
    expect(aiAfterRefund.aiCreditsRemaining).toBe(30);
    expect(webAfterRefund.webCreditsUsed).toBe(0);
    expect(webAfterRefund.webCreditsRemaining).toBe(50);
  });

  test("refunds AI credits on processing_failed", async () => {
    const billing = createService({
      planCatalog: createCatalog({ monthlyAiCredits: 30 }),
    });
    const conversionId = "22222222-2222-4222-8222-222222222222";

    await billing.consumeAiCredits({
      userId: "user_1",
      conversionId,
      toolId: aiToolId,
    });

    expect(
      await billing.refundAiCreditsForFailure({
        userId: "user_1",
        conversionId,
        errorCode: "processing_failed",
      }),
    ).toBe(true);
    expect(
      await billing.refundAiCreditsForFailure({
        userId: "user_1",
        conversionId,
        errorCode: "processing_failed",
      }),
    ).toBe(false);
    expect(
      await billing.refundAiCreditsForFailure({
        userId: "user_1",
        conversionId: "33333333-3333-4333-8333-333333333333",
        errorCode: "unsupported_conversion",
      }),
    ).toBe(false);

    const balance = await billing.getAiCreditBalance("user_1");
    expect(balance.aiCreditsUsed).toBe(0);
    expect(balance.aiCreditsRemaining).toBe(30);
  });

  test("assertCanSpendAiCredits blocks when empty", async () => {
    const billing = createService({
      planCatalog: createCatalog({ monthlyAiCredits: 0 }),
    });

    try {
      await billing.assertCanSpendAiCredits({
        userId: "user_1",
        toolId: aiToolId,
      });
      throw new Error("expected limit");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe(APP_ERROR_CODES.PLAN_LIMIT_REACHED);
      }
    }
  });

  test("consumes AI credits idempotently by conversion id", async () => {
    const billing = createService({
      planCatalog: createCatalog({ monthlyAiCredits: 30 }),
    });
    const conversionId = "44444444-4444-4444-8444-444444444444";

    expect(
      await billing.consumeAiCredits({
        userId: "user_1",
        conversionId,
        toolId: aiToolId,
      }),
    ).toBe(true);
    expect(
      await billing.consumeAiCredits({
        userId: "user_1",
        conversionId,
        toolId: aiToolId,
      }),
    ).toBe(false);

    const balance = await billing.getAiCreditBalance("user_1");
    expect(balance.aiCreditsUsed).toBe(10);
  });
});
