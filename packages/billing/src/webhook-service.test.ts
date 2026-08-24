import { describe, expect, test } from "bun:test";
import { loadBillingConfig } from "@repo/config";
import { APP_ERROR_CODES, AppError, isAppError } from "@repo/core";
import type { PolarWebhookEvent, VerifyPolarWebhook } from "./billing-types.js";
import { createMemoryBillingRepository } from "./memory-billing-repository.js";
import { getUtcMonthPeriod } from "./usage-period.js";
import { handlePolarWebhook } from "./webhook-service.js";

const processedAt = new Date("2026-08-15T12:00:00.000Z");

function createVerify(event: PolarWebhookEvent): VerifyPolarWebhook {
  return () => event;
}

function failingVerify(error: Error): VerifyPolarWebhook {
  return () => {
    throw error;
  };
}

describe("handlePolarWebhook", () => {
  test("rejects an invalid signature before processing", async () => {
    try {
      await handlePolarWebhook({
        body: "{}",
        headers: {},
        config: loadBillingConfig({
          POLAR_WEBHOOK_SECRET: "whsec_test",
          POLAR_PRO_PRODUCT_ID: "prod_pro",
        }).polar,
        repository: createMemoryBillingRepository(),
        verifyWebhook: failingVerify(
          new AppError({
            code: APP_ERROR_CODES.FORBIDDEN,
            message: "Invalid webhook signature",
          }),
        ),
        now: () => processedAt,
      });
      throw new Error("expected verification to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe(APP_ERROR_CODES.FORBIDDEN);
      }
    }
  });

  test("rejects a malformed subscription payload", async () => {
    try {
      await handlePolarWebhook({
        body: "{}",
        headers: {},
        config: loadBillingConfig({
          POLAR_WEBHOOK_SECRET: "whsec_test",
          POLAR_PRO_PRODUCT_ID: "prod_pro",
        }).polar,
        repository: createMemoryBillingRepository(),
        verifyWebhook: createVerify({
          id: "evt_bad",
          type: "subscription.updated",
          data: { id: "sub_1" },
        }),
        now: () => processedAt,
      });
      throw new Error("expected malformed event to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe(APP_ERROR_CODES.VALIDATION_ERROR);
      }
    }
  });

  test("ignores unknown events after claiming them", async () => {
    const repository = createMemoryBillingRepository();
    const result = await handlePolarWebhook({
      body: "{}",
      headers: {},
      config: loadBillingConfig({
        POLAR_WEBHOOK_SECRET: "whsec_test",
        POLAR_PRO_PRODUCT_ID: "prod_pro",
      }).polar,
      repository,
      verifyWebhook: createVerify({
        id: "evt_order",
        type: "order.created",
        data: {},
      }),
      now: () => processedAt,
    });

    expect(result.outcome).toBe("ignored");
  });

  test("activates Pro from a valid subscription event", async () => {
    const repository = createMemoryBillingRepository();
    const result = await handlePolarWebhook({
      body: "{}",
      headers: {},
      config: loadBillingConfig({
        POLAR_WEBHOOK_SECRET: "whsec_test",
        POLAR_PRO_PRODUCT_ID: "prod_pro",
      }).polar,
      repository,
      verifyWebhook: createVerify({
        id: "evt_active",
        type: "subscription.active",
        data: {
          id: "sub_polar_1",
          status: "active",
          productId: "prod_pro",
          customerId: "cus_1",
          externalCustomerId: "user_1",
          cancelAtPeriodEnd: false,
          currentPeriodEnd: "2026-09-01T00:00:00.000Z",
        },
      }),
      now: () => processedAt,
    });
    const subscription =
      await repository.findLatestSubscriptionByUserId("user_1");

    expect(result.outcome).toBe("applied");
    expect(subscription?.plan).toBe("pro");
    expect(subscription?.status).toBe("active");
  });

  test("stores API subscriptions separately from the web Pro plan", async () => {
    const repository = createMemoryBillingRepository();
    const result = await handlePolarWebhook({
      body: "{}",
      headers: {},
      config: loadBillingConfig({
        POLAR_WEBHOOK_SECRET: "whsec_test",
        POLAR_PRO_PRODUCT_ID: "prod_pro",
        POLAR_API_STARTER_PRODUCT_ID: "prod_api_starter",
      }).polar,
      repository,
      verifyWebhook: createVerify({
        id: "evt_api",
        type: "subscription.active",
        data: {
          id: "sub_api_1",
          status: "active",
          productId: "prod_api_starter",
          customerId: "cus_1",
          externalCustomerId: "user_1",
        },
      }),
      now: () => processedAt,
    });
    const web = await repository.findLatestSubscriptionByUserId("user_1");
    const api = await repository.findLatestApiSubscriptionByUserId("user_1");

    expect(result.outcome).toBe("applied");
    expect(web).toBeUndefined();
    expect(api?.productKey).toBe("starter");
    expect(api?.status).toBe("active");
  });

  test("adds one-time API credit packs from a paid Polar order", async () => {
    const repository = createMemoryBillingRepository();
    const result = await handlePolarWebhook({
      body: "{}",
      headers: {},
      config: loadBillingConfig({
        POLAR_WEBHOOK_SECRET: "whsec_test",
        POLAR_PRO_PRODUCT_ID: "prod_pro",
        POLAR_API_CREDIT_PACKS: "prod_pack:500",
      }).polar,
      repository,
      verifyWebhook: createVerify({
        id: "evt_pack",
        type: "order.paid",
        data: {
          id: "ord_1",
          status: "paid",
          productId: "prod_pack",
          customerId: "cus_1",
          externalCustomerId: "user_1",
        },
      }),
      now: () => processedAt,
    });
    const period = getUtcMonthPeriod(processedAt);
    const balance = await repository.ensureApiCreditGrant({
      userId: "user_1",
      periodStart: period.start,
      periodEnd: period.end,
      grantAmount: 0,
      now: processedAt,
    });

    expect(result.outcome).toBe("applied");
    expect(balance.apiCreditsGranted).toBe(500);
  });

  test("keeps Pro until the period ends after a scheduled cancellation", async () => {
    const repository = createMemoryBillingRepository();
    await handlePolarWebhook({
      body: "{}",
      headers: {},
      config: loadBillingConfig({
        POLAR_WEBHOOK_SECRET: "whsec_test",
        POLAR_PRO_PRODUCT_ID: "prod_pro",
      }).polar,
      repository,
      verifyWebhook: createVerify({
        id: "evt_cancel",
        type: "subscription.canceled",
        data: {
          id: "sub_polar_1",
          status: "canceled",
          product_id: "prod_pro",
          customer_id: "cus_1",
          external_customer_id: "user_1",
          cancel_at_period_end: true,
          current_period_end: "2026-09-01T00:00:00.000Z",
        },
      }),
      now: () => processedAt,
    });

    const subscription =
      await repository.findLatestSubscriptionByUserId("user_1");
    expect(subscription?.cancelAtPeriodEnd).toBe(true);
    expect(subscription?.status).toBe("canceled");
  });

  test("ignores a duplicate event id", async () => {
    const repository = createMemoryBillingRepository();
    const input = {
      body: "{}",
      headers: {},
      config: loadBillingConfig({
        POLAR_WEBHOOK_SECRET: "whsec_test",
        POLAR_PRO_PRODUCT_ID: "prod_pro",
      }).polar,
      repository,
      verifyWebhook: createVerify({
        id: "evt_dup",
        type: "subscription.updated",
        data: {
          id: "sub_polar_1",
          status: "active",
          productId: "prod_pro",
          customerId: "cus_1",
          externalCustomerId: "user_1",
        },
      }),
      now: () => processedAt,
    };

    expect((await handlePolarWebhook(input)).outcome).toBe("applied");
    expect((await handlePolarWebhook(input)).outcome).toBe("duplicate");
  });
});
