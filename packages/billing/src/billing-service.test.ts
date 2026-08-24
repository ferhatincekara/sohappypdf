import { describe, expect, test } from "bun:test";
import { loadBillingConfig } from "@repo/config";
import { APP_ERROR_CODES, isAppError } from "@repo/core";
import { createBillingService } from "./billing-service.js";
import type { PolarClient } from "./billing-types.js";
import { createMemoryBillingRepository } from "./memory-billing-repository.js";

const now = new Date("2026-08-15T12:00:00.000Z");

function createPolarClientMock(
  overrides: Partial<PolarClient> = {},
): PolarClient {
  return {
    async findCustomerByExternalId() {
      return null;
    },
    async createCustomer() {
      return { id: "cus_polar_1" };
    },
    async createCheckout() {
      return { url: "https://polar.example/checkout/cs_1" };
    },
    async createCustomerPortal() {
      return { url: "https://polar.example/portal/ps_1" };
    },
    async listSubscriptionsByExternalId() {
      return [];
    },
    ...overrides,
  };
}

function createService(options?: {
  polarClient?: PolarClient;
  userEmails?: Record<string, string>;
  repository?: ReturnType<typeof createMemoryBillingRepository>;
}) {
  return createBillingService({
    repository:
      options?.repository ??
      createMemoryBillingRepository({
        userEmails: options?.userEmails ?? { user_1: "user@example.com" },
      }),
    config: loadBillingConfig({
      POLAR_ACCESS_TOKEN: "polar_at_test",
      POLAR_WEBHOOK_SECRET: "whsec_test",
      POLAR_PRO_PRODUCT_ID: "prod_pro",
      APP_URL: "https://app.example",
    }),
    polarClient: options?.polarClient ?? createPolarClientMock(),
    now: () => now,
  });
}

async function seedProSubscription(
  repository: ReturnType<typeof createMemoryBillingRepository>,
) {
  await repository.upsertCustomer({
    userId: "user_1",
    polarCustomerId: "cus_polar_1",
    createdAt: now,
    updatedAt: now,
  });
  await repository.upsertSubscription({
    userId: "user_1",
    polarSubscriptionId: "sub_polar_1",
    polarProductId: "prod_pro",
    plan: "pro",
    status: "active",
    cancelAtPeriodEnd: false,
    currentPeriodStart: new Date("2026-08-01T00:00:00.000Z"),
    currentPeriodEnd: new Date("2026-09-01T00:00:00.000Z"),
    endedAt: null,
    updatedAt: now,
  });
}

describe("createBillingService", () => {
  test("returns free entitlements when no subscription exists", async () => {
    const billing = createService();
    const entitlements = await billing.getEntitlements("user_1");

    expect(entitlements.plan).toBe("free");
    expect(entitlements.limits.monthlyConversions).toBe(20);
    expect(entitlements.limits.maxApiKeys).toBe(2);
  });

  test("creates Polar checkout without granting Pro", async () => {
    const billing = createService();
    const checkout = await billing.createCheckout("user_1");
    const entitlements = await billing.getEntitlements("user_1");

    expect(checkout.url).toBe("https://polar.example/checkout/cs_1");
    expect(entitlements.plan).toBe("free");
  });

  test("reuses an existing Polar customer instead of creating a duplicate", async () => {
    let created = 0;
    const billing = createService({
      polarClient: createPolarClientMock({
        async findCustomerByExternalId() {
          return { id: "cus_existing" };
        },
        async createCustomer() {
          created += 1;
          return { id: "cus_new" };
        },
      }),
    });

    await billing.createCheckout("user_1");
    expect(created).toBe(0);
  });

  test("does not create checkout when Polar is not configured", async () => {
    const billing = createBillingService({
      repository: createMemoryBillingRepository(),
      config: loadBillingConfig({}),
      now: () => now,
    });

    try {
      await billing.createCheckout("user_1");
      throw new Error("expected checkout to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe(APP_ERROR_CODES.CONFIGURATION_ERROR);
      }
    }
  });

  test("records conversion usage once per conversion", async () => {
    const billing = createService();

    expect(
      await billing.recordConversionUsage({
        userId: "user_1",
        conversionId: "11111111-1111-4111-8111-111111111111",
      }),
    ).toBe(true);
    expect(
      await billing.recordConversionUsage({
        userId: "user_1",
        conversionId: "11111111-1111-4111-8111-111111111111",
      }),
    ).toBe(false);

    const usage = await billing.getConversionUsage("user_1");
    expect(usage.conversionsUsed).toBe(1);
  });

  test("includes usage and limits in the public billing status", async () => {
    const billing = createService();
    const status = await billing.getBillingStatus({
      userId: "user_1",
      storageUsedBytes: 1024,
      apiKeyCount: 1,
    });

    expect(status.plan).toBe("free");
    expect(status.canUpgrade).toBe(true);
    expect(status.usage.webCreditsLimit).toBe(100);
    expect(status.usage.webCreditsUsed).toBe(0);
    expect(status.usage.conversionsLimit).toBe(20);
    expect(status.usage.storageUsedBytes).toBe(1024);
    expect(status.limits.maxFileSizeBytes).toBe(20 * 1024 * 1024);
    expect(JSON.stringify(status).includes("polar_at_test")).toBe(false);
  });

  test("reconciles an active Polar subscription without trusting checkout query params", async () => {
    const billing = createService({
      polarClient: createPolarClientMock({
        async listSubscriptionsByExternalId() {
          return [
            {
              id: "sub_polar_1",
              status: "active",
              productId: "prod_pro",
              customerId: "cus_polar_1",
              externalCustomerId: "user_1",
              currentPeriodEnd: "2026-09-15T12:00:00.000Z",
            },
          ];
        },
      }),
    });

    const status = await billing.getBillingStatus({
      userId: "user_1",
      storageUsedBytes: 0,
      apiKeyCount: 0,
    });

    expect(status.plan).toBe("pro");
    expect(status.canUpgrade).toBe(false);
    expect(status.canManage).toBe(true);
    expect(status.subscriptionStatus).toBe("active");
  });

  test("does not grant Pro when Polar has no subscription for the user", async () => {
    const billing = createService();
    const status = await billing.getBillingStatus({
      userId: "user_1",
      storageUsedBytes: 0,
      apiKeyCount: 0,
    });

    expect(status.plan).toBe("free");
    expect(status.canUpgrade).toBe(true);
  });

  test("drops local Pro when Polar no longer has an active subscription", async () => {
    const repository = createMemoryBillingRepository({
      userEmails: { user_1: "user@example.com" },
    });
    await seedProSubscription(repository);
    const billing = createService({ repository });

    const status = await billing.getBillingStatus({
      userId: "user_1",
      storageUsedBytes: 0,
      apiKeyCount: 0,
    });

    expect(status.plan).toBe("free");
    expect(status.canUpgrade).toBe(true);
    expect(status.subscriptionStatus).toBe("revoked");
  });

  test("keeps Pro through the paid period when Polar schedules cancellation", async () => {
    const repository = createMemoryBillingRepository({
      userEmails: { user_1: "user@example.com" },
    });
    await seedProSubscription(repository);
    const billing = createService({
      repository,
      polarClient: createPolarClientMock({
        async listSubscriptionsByExternalId() {
          return [
            {
              id: "sub_polar_1",
              status: "active",
              productId: "prod_pro",
              customerId: "cus_polar_1",
              externalCustomerId: "user_1",
              cancelAtPeriodEnd: true,
              currentPeriodEnd: "2026-09-01T00:00:00.000Z",
            },
          ];
        },
      }),
    });

    const status = await billing.getBillingStatus({
      userId: "user_1",
      storageUsedBytes: 0,
      apiKeyCount: 0,
    });

    expect(status.plan).toBe("pro");
    expect(status.cancelAtPeriodEnd).toBe(true);
    expect(status.canUpgrade).toBe(false);
  });

  test("keeps local Pro when Polar reconcile fails", async () => {
    const repository = createMemoryBillingRepository({
      userEmails: { user_1: "user@example.com" },
    });
    await seedProSubscription(repository);
    const billing = createService({
      repository,
      polarClient: createPolarClientMock({
        async listSubscriptionsByExternalId() {
          throw new Error("polar unavailable");
        },
      }),
    });

    const status = await billing.getBillingStatus({
      userId: "user_1",
      storageUsedBytes: 0,
      apiKeyCount: 0,
    });

    expect(status.plan).toBe("pro");
    expect(status.canUpgrade).toBe(false);
  });
});
