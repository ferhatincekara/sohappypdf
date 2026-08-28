import { describe, expect, test } from "bun:test";
import { DEFAULT_API_STARTER_CREDITS, loadBillingConfig } from "@repo/config";
import { APP_ERROR_CODES, AppError, isAppError } from "@repo/core";
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
    async updateSubscription() {},
    async createCustomerPortal() {
      return { url: "https://polar.example/portal/ps_1" };
    },
    async listSubscriptionsByExternalId() {
      return [];
    },
    async listSubscriptionsByCustomerId() {
      return [];
    },
    async listSubscriptionsByEmail() {
      return [];
    },
    async getProduct() {
      return null;
    },
    ...overrides,
  };
}

function createService(options?: {
  polarClient?: PolarClient;
  userEmails?: Record<string, string>;
  repository?: ReturnType<typeof createMemoryBillingRepository>;
  env?: Record<string, string | undefined>;
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
      ...options?.env,
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
    expect(entitlements.limits.monthlyConversions).toBe(155);
    expect(entitlements.limits.operationsPerDay).toBe(5);
    expect(entitlements.limits.maxApiKeys).toBe(2);
  });

  test("creates Polar checkout without granting Pro", async () => {
    const billing = createService();
    const checkout = await billing.createCheckout("user_1");
    const entitlements = await billing.getEntitlements("user_1");

    expect(checkout.url).toBe("https://polar.example/checkout/cs_1");
    expect(entitlements.plan).toBe("free");

    const status = await billing.getBillingStatus({
      userId: "user_1",
      storageUsedBytes: 0,
      apiKeyCount: 0,
    });
    expect(status.canManage).toBe(false);
  });

  test("sends the account email to Polar checkout and drops local return URLs", async () => {
    let checkoutInput: {
      productIds: readonly string[];
      externalCustomerId: string;
      customerEmail: string;
      successUrl: string;
      returnUrl?: string;
    } | null = null;
    const billing = createService({
      env: {
        APP_URL: "http://localhost:3000",
      },
      polarClient: createPolarClientMock({
        async createCheckout(input) {
          checkoutInput = input;
          return { url: "https://polar.example/checkout/cs_local" };
        },
      }),
    });

    const checkout = await billing.createCheckout("user_1");

    expect(checkout.url).toBe("https://polar.example/checkout/cs_local");
    expect(checkoutInput).toEqual({
      productIds: ["prod_pro"],
      externalCustomerId: "user_1",
      customerEmail: "user@example.com",
      successUrl: "http://localhost:3000/account/billing?checkout=success",
    });
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

  test("opens Polar portal with the app user id", async () => {
    const repository = createMemoryBillingRepository({
      userEmails: { user_1: "user@example.com" },
    });
    await seedProSubscription(repository);

    let portalInput: {
      externalCustomerId: string;
      customerId?: string;
      returnUrl?: string;
    } | null = null;
    const billing = createService({
      repository,
      polarClient: createPolarClientMock({
        async createCustomerPortal(input) {
          portalInput = input;
          return { url: "https://polar.example/portal/ps_1" };
        },
      }),
    });

    const portal = await billing.createCustomerPortal("user_1");

    expect(portal.url).toBe("https://polar.example/portal/ps_1");
    expect(portalInput).toEqual({
      externalCustomerId: "user_1",
      customerId: "cus_polar_1",
      returnUrl: "https://app.example/account/billing",
    });
  });

  test("does not open Polar portal before a subscription exists", async () => {
    let created = 0;
    const billing = createService({
      polarClient: createPolarClientMock({
        async createCustomer() {
          created += 1;
          return { id: "cus_polar_1" };
        },
      }),
    });

    try {
      await billing.createCustomerPortal("user_1");
      throw new Error("expected portal to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe(APP_ERROR_CODES.NOT_FOUND);
      }
    }

    expect(created).toBe(0);
  });

  test("recreates the Polar customer when the portal cannot find them", async () => {
    const repository = createMemoryBillingRepository({
      userEmails: { user_1: "user@example.com" },
    });
    await seedProSubscription(repository);
    await repository.upsertCustomer({
      userId: "user_1",
      polarCustomerId: "cus_stale",
      createdAt: now,
      updatedAt: now,
    });

    let portalAttempts = 0;
    let created = 0;
    const billing = createService({
      repository,
      polarClient: createPolarClientMock({
        async createCustomer() {
          created += 1;
          return { id: "cus_polar_retry" };
        },
        async createCustomerPortal() {
          portalAttempts += 1;
          if (portalAttempts === 1) {
            throw new AppError({
              code: APP_ERROR_CODES.NOT_FOUND,
              message: "Polar customer portal was not found",
            });
          }

          return { url: "https://polar.example/portal/ps_retry" };
        },
      }),
    });

    const portal = await billing.createCustomerPortal("user_1");

    expect(portal.url).toBe("https://polar.example/portal/ps_retry");
    expect(portalAttempts).toBe(2);
    expect(created).toBe(2);
  });

  test("recreates the Polar customer when the portal rejects the identity", async () => {
    const repository = createMemoryBillingRepository({
      userEmails: { user_1: "user@example.com" },
    });
    await seedProSubscription(repository);
    await repository.upsertCustomer({
      userId: "user_1",
      polarCustomerId: "cus_stale",
      createdAt: now,
      updatedAt: now,
    });

    let portalAttempts = 0;
    const billing = createService({
      repository,
      polarClient: createPolarClientMock({
        async createCustomer() {
          return { id: "cus_polar_retry" };
        },
        async createCustomerPortal() {
          portalAttempts += 1;
          if (portalAttempts === 1) {
            throw new AppError({
              code: APP_ERROR_CODES.VALIDATION_ERROR,
              message: "Polar customer portal was rejected",
            });
          }

          return { url: "https://polar.example/portal/ps_retry" };
        },
      }),
    });

    const portal = await billing.createCustomerPortal("user_1");

    expect(portal.url).toBe("https://polar.example/portal/ps_retry");
    expect(portalAttempts).toBe(2);
  });

  test("links a Polar customer for portal when the local record is stale", async () => {
    const repository = createMemoryBillingRepository({
      userEmails: { user_1: "user@example.com" },
    });
    await seedProSubscription(repository);
    await repository.upsertCustomer({
      userId: "user_1",
      polarCustomerId: "cus_stale",
      createdAt: now,
      updatedAt: now,
    });

    let created = 0;
    const billing = createService({
      repository,
      polarClient: createPolarClientMock({
        async createCustomer() {
          created += 1;
          return { id: "cus_polar_linked" };
        },
      }),
    });

    const portal = await billing.createCustomerPortal("user_1");

    expect(portal.url).toBe("https://polar.example/portal/ps_1");
    expect(created).toBe(1);
    expect(
      (await repository.findCustomerByUserId("user_1"))?.polarCustomerId,
    ).toBe("cus_polar_linked");
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
        toolId: "pdf-to-jpg",
        apiKeyId: "key_1",
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
    expect(status.canManage).toBe(false);
    expect(status.usage.webCreditsLimit).toBe(1_550);
    expect(status.usage.webCreditsUsed).toBe(0);
    expect(status.usage.webCreditsRemaining).toBe(1_550);
    expect(status.usage.aiCreditsLimit).toBe(0);
    expect(status.usage.aiCreditsUsed).toBe(0);
    expect(status.usage.aiCreditsRemaining).toBe(0);
    expect(status.usage.conversionsLimit).toBe(5);
    expect(status.usage.conversionsUsed).toBe(0);
    expect(status.usage.storageUsedBytes).toBe(1024);
    expect(status.limits.maxFileSizeBytes).toBe(25 * 1024 * 1024);
    expect(status.limits.apiRequestsPerMinute).toBe(30);
    expect(status.api.creditsLimit).toBe(100);
    expect(status.api.creditsRemaining).toBe(100);
    expect(status.api.product).toBeNull();
    expect(status.prices.pro.monthlyUsd).toBe(5);
    expect(status.prices.starter.monthlyUsd).toBe(9);
    expect(JSON.stringify(status).includes("polar_at_test")).toBe(false);
  });

  test("counts recorded conversions in the public daily usage", async () => {
    const billing = createService();

    await billing.recordConversionUsage({
      userId: "user_1",
      conversionId: "11111111-1111-4111-8111-111111111112",
      toolId: "pdf-to-jpg",
    });

    const status = await billing.getBillingStatus({
      userId: "user_1",
      storageUsedBytes: 0,
      apiKeyCount: 0,
    });

    expect(status.usage.conversionsUsed).toBe(1);
    expect(status.usage.conversionsLimit).toBe(5);
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

  test("reconciles Pro from the Polar customer when the external id does not match", async () => {
    const repository = createMemoryBillingRepository({
      userEmails: { user_1: "user@example.com" },
    });
    await repository.upsertCustomer({
      userId: "user_1",
      polarCustomerId: "cus_polar_email",
      createdAt: now,
      updatedAt: now,
    });
    const billing = createService({
      repository,
      polarClient: createPolarClientMock({
        async listSubscriptionsByCustomerId(customerId) {
          if (customerId !== "cus_polar_email") {
            return [];
          }

          return [
            {
              id: "sub_polar_email",
              status: "active",
              productId: "prod_pro",
              customerId: "cus_polar_email",
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
  });

  test("reconciles Pro from the Polar customer email when no local Polar id exists", async () => {
    const billing = createService({
      polarClient: createPolarClientMock({
        async listSubscriptionsByEmail(email) {
          if (email !== "user@example.com") {
            return [];
          }

          return [
            {
              id: "sub_polar_email",
              status: "active",
              productId: "prod_pro",
              customerId: "cus_polar_email",
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
    expect(status.canManage).toBe(true);
  });

  test("links a Polar customer by email then reads the subscription after a local wipe", async () => {
    let created = 0;
    const billing = createService({
      polarClient: createPolarClientMock({
        async createCustomer() {
          created += 1;
          return { id: "cus_polar_recovered" };
        },
        async listSubscriptionsByCustomerId(customerId) {
          if (customerId !== "cus_polar_recovered") {
            return [];
          }

          return [
            {
              id: "sub_polar_recovered",
              status: "active",
              productId: "prod_pro",
              customerId: "cus_polar_recovered",
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

    expect(created).toBe(1);
    expect(status.plan).toBe("pro");
    expect(status.canManage).toBe(true);
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
    expect(status.canManage).toBe(false);
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

  test("drops local Pro when Polar changed that subscription into an API pack", async () => {
    const repository = createMemoryBillingRepository({
      userEmails: { user_1: "user@example.com" },
    });
    await seedProSubscription(repository);
    const billing = createService({
      repository,
      env: {
        POLAR_API_STARTER_PRODUCT_ID: "prod_api_starter",
      },
      polarClient: createPolarClientMock({
        async listSubscriptionsByExternalId() {
          return [
            {
              id: "sub_polar_1",
              status: "active",
              productId: "prod_api_starter",
              customerId: "cus_polar_1",
              externalCustomerId: "user_1",
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

    expect(status.plan).toBe("free");
    expect(status.canUpgrade).toBe(true);
    expect(status.api.product).toBe("starter");
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

  test("reconciles an API subscription without changing the web plan", async () => {
    const billing = createService({
      env: {
        POLAR_API_STARTER_PRODUCT_ID: "prod_api_starter",
      },
      polarClient: createPolarClientMock({
        async listSubscriptionsByExternalId() {
          return [
            {
              id: "sub_api_1",
              status: "active",
              productId: "prod_api_starter",
              customerId: "cus_polar_1",
              externalCustomerId: "user_1",
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

    expect(status.plan).toBe("free");
    expect(status.canUpgrade).toBe(true);
    expect(status.api.product).toBe("starter");
    expect(status.api.creditsLimit).toBe(DEFAULT_API_STARTER_CREDITS);
    expect(status.api.creditsRemaining).toBe(DEFAULT_API_STARTER_CREDITS);
  });

  test("drops API credits when Polar no longer has an API subscription", async () => {
    const repository = createMemoryBillingRepository({
      userEmails: { user_1: "user@example.com" },
    });
    await repository.upsertApiSubscription({
      userId: "user_1",
      polarSubscriptionId: "sub_api_1",
      polarProductId: "prod_api_scale",
      productKey: "scale",
      status: "active",
      cancelAtPeriodEnd: false,
      currentPeriodStart: new Date("2026-08-01T00:00:00.000Z"),
      currentPeriodEnd: new Date("2026-09-01T00:00:00.000Z"),
      endedAt: null,
      updatedAt: now,
    });
    const withPack = createService({
      repository,
      env: {
        POLAR_API_SCALE_PRODUCT_ID: "prod_api_scale",
      },
      polarClient: createPolarClientMock({
        async listSubscriptionsByExternalId() {
          return [
            {
              id: "sub_api_1",
              status: "active",
              productId: "prod_api_scale",
              customerId: "cus_polar_1",
              externalCustomerId: "user_1",
            },
          ];
        },
      }),
    });
    const before = await withPack.getBillingStatus({
      userId: "user_1",
      storageUsedBytes: 0,
      apiKeyCount: 0,
    });
    expect(before.api.creditsLimit).toBe(100_000);

    const billing = createService({
      repository,
      env: {
        POLAR_API_SCALE_PRODUCT_ID: "prod_api_scale",
      },
    });
    const status = await billing.getBillingStatus({
      userId: "user_1",
      storageUsedBytes: 0,
      apiKeyCount: 0,
    });

    expect(status.api.product).toBeNull();
    expect(status.api.creditsLimit).toBe(100);
    expect(status.api.creditsRemaining).toBe(100);
  });

  test("creates checkout for an API product using configured Polar IDs", async () => {
    let productIds: readonly string[] | undefined;
    const billing = createService({
      env: {
        POLAR_API_STARTER_PRODUCT_ID: "prod_api_starter",
        POLAR_API_STARTER_YEARLY_PRODUCT_ID: "prod_api_starter_yearly",
      },
      polarClient: createPolarClientMock({
        async createCheckout(input) {
          productIds = input.productIds;
          return { url: "https://polar.example/checkout/api" };
        },
      }),
    });

    const checkout = await billing.createCheckout("user_1", "api-starter");
    expect(checkout.url).toBe("https://polar.example/checkout/api");
    expect(productIds).toEqual(["prod_api_starter"]);
  });

  test("creates yearly checkout with a single Polar product ID", async () => {
    let productIds: readonly string[] | undefined;
    const billing = createService({
      env: {
        POLAR_API_STARTER_PRODUCT_ID: "prod_api_starter",
        POLAR_API_STARTER_YEARLY_PRODUCT_ID: "prod_api_starter_yearly",
      },
      polarClient: createPolarClientMock({
        async createCheckout(input) {
          productIds = input.productIds;
          return { url: "https://polar.example/checkout/api-yearly" };
        },
      }),
    });

    const checkout = await billing.createCheckout(
      "user_1",
      "api-starter",
      "yearly",
    );
    expect(checkout.url).toBe("https://polar.example/checkout/api-yearly");
    expect(productIds).toEqual(["prod_api_starter_yearly"]);
  });

  test("allows Pro checkout while an API pack is already active", async () => {
    const repository = createMemoryBillingRepository({
      userEmails: { user_1: "user@example.com" },
    });
    await repository.upsertApiSubscription({
      userId: "user_1",
      polarSubscriptionId: "sub_api_1",
      polarProductId: "prod_api_starter",
      productKey: "starter",
      status: "active",
      cancelAtPeriodEnd: false,
      currentPeriodStart: new Date("2026-08-01T00:00:00.000Z"),
      currentPeriodEnd: new Date("2026-09-01T00:00:00.000Z"),
      endedAt: null,
      updatedAt: now,
    });
    const billing = createService({
      repository,
      env: {
        POLAR_API_STARTER_PRODUCT_ID: "prod_api_starter",
      },
      polarClient: createPolarClientMock({
        async listSubscriptionsByExternalId() {
          return [
            {
              id: "sub_api_1",
              status: "active",
              productId: "prod_api_starter",
              customerId: "cus_polar_1",
              externalCustomerId: "user_1",
            },
          ];
        },
      }),
    });

    const checkout = await billing.createCheckout("user_1", "pro");
    expect(checkout.url).toBe("https://polar.example/checkout/cs_1");
  });

  test("allows API pack checkout while Pro is already active", async () => {
    const repository = createMemoryBillingRepository({
      userEmails: { user_1: "user@example.com" },
    });
    await seedProSubscription(repository);
    let productIds: readonly string[] | undefined;
    const billing = createService({
      repository,
      env: {
        POLAR_API_STARTER_PRODUCT_ID: "prod_api_starter",
      },
      polarClient: createPolarClientMock({
        async listSubscriptionsByExternalId() {
          return [
            {
              id: "sub_polar_1",
              status: "active",
              productId: "prod_pro",
              customerId: "cus_polar_1",
              externalCustomerId: "user_1",
            },
          ];
        },
        async createCheckout(input) {
          productIds = input.productIds;
          return { url: "https://polar.example/checkout/api" };
        },
      }),
    });

    const checkout = await billing.createCheckout("user_1", "api-starter");
    expect(checkout.url).toBe("https://polar.example/checkout/api");
    expect(productIds).toEqual(["prod_api_starter"]);
  });

  test("switches an active API pack without opening a second Polar checkout", async () => {
    const repository = createMemoryBillingRepository({
      userEmails: { user_1: "user@example.com" },
    });
    await repository.upsertApiSubscription({
      userId: "user_1",
      polarSubscriptionId: "sub_api_1",
      polarProductId: "prod_api_starter",
      productKey: "starter",
      status: "active",
      cancelAtPeriodEnd: false,
      currentPeriodStart: new Date("2026-08-01T00:00:00.000Z"),
      currentPeriodEnd: new Date("2026-09-01T00:00:00.000Z"),
      endedAt: null,
      updatedAt: now,
    });
    let currentProductId = "prod_api_starter";
    let updatedProductId: string | undefined;
    const billing = createService({
      repository,
      env: {
        POLAR_API_STARTER_PRODUCT_ID: "prod_api_starter",
        POLAR_API_GROWTH_PRODUCT_ID: "prod_api_growth",
      },
      polarClient: createPolarClientMock({
        async listSubscriptionsByExternalId() {
          return [
            {
              id: "sub_api_1",
              status: "active",
              productId: currentProductId,
              customerId: "cus_polar_1",
              externalCustomerId: "user_1",
            },
          ];
        },
        async createCheckout() {
          throw new Error("pack switch should not open a new checkout");
        },
        async updateSubscription(input) {
          updatedProductId = input.productId;
          currentProductId = input.productId;
        },
      }),
    });

    const before = await billing.getApiCreditBalance("user_1");
    expect(before.apiCreditsGranted).toBe(DEFAULT_API_STARTER_CREDITS);

    const checkout = await billing.createCheckout("user_1", "api-growth");
    expect(checkout.url).toBeNull();
    expect(updatedProductId).toBe("prod_api_growth");

    const status = await billing.getBillingStatus({
      userId: "user_1",
      storageUsedBytes: 0,
      apiKeyCount: 0,
    });
    expect(status.api.product).toBe("growth");
    expect(status.api.creditsLimit).toBe(10_000);
    expect(status.api.creditsRemaining).toBe(10_000);
  });

  test("rejects checkout for the API pack already active", async () => {
    const repository = createMemoryBillingRepository({
      userEmails: { user_1: "user@example.com" },
    });
    await repository.upsertApiSubscription({
      userId: "user_1",
      polarSubscriptionId: "sub_api_1",
      polarProductId: "prod_api_starter",
      productKey: "starter",
      status: "active",
      cancelAtPeriodEnd: false,
      currentPeriodStart: new Date("2026-08-01T00:00:00.000Z"),
      currentPeriodEnd: new Date("2026-09-01T00:00:00.000Z"),
      endedAt: null,
      updatedAt: now,
    });
    const billing = createService({
      repository,
      env: {
        POLAR_API_STARTER_PRODUCT_ID: "prod_api_starter",
        POLAR_API_GROWTH_PRODUCT_ID: "prod_api_growth",
      },
      polarClient: createPolarClientMock({
        async listSubscriptionsByExternalId() {
          return [
            {
              id: "sub_api_1",
              status: "active",
              productId: "prod_api_starter",
              customerId: "cus_polar_1",
              externalCustomerId: "user_1",
            },
          ];
        },
        async createCheckout() {
          throw new Error("same API pack checkout should not start");
        },
      }),
    });

    try {
      await billing.createCheckout("user_1", "api-starter");
      throw new Error("expected checkout to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe(APP_ERROR_CODES.CONFLICT);
      }
    }
  });

  test("keeps API pack cards after a pack is already active", async () => {
    const billing = createService({
      env: {
        POLAR_API_STARTER_PRODUCT_ID: "prod_api_starter",
        POLAR_API_GROWTH_PRODUCT_ID: "prod_api_growth",
      },
      polarClient: createPolarClientMock({
        async listSubscriptionsByExternalId() {
          return [
            {
              id: "sub_api_1",
              status: "active",
              productId: "prod_api_starter",
              customerId: "cus_polar_1",
              externalCustomerId: "user_1",
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

    expect(status.api.product).toBe("starter");
    expect(status.api.canSubscribe).toBe(true);
    expect(status.api.availableProducts).toEqual(["api-starter", "api-growth"]);
    expect(status.canUpgrade).toBe(true);
  });

  test("records an auditable credit adjustment with a required reason", async () => {
    const billing = createService();
    const before = await billing.getWebCreditBalance("user_1");
    await billing.adjustCredits({
      userId: "user_1",
      source: "web",
      amount: 25,
      reason: "support goodwill credit",
      actorUserId: "admin_1",
    });

    const balance = await billing.getWebCreditBalance("user_1");
    expect(balance.webCreditsGranted).toBe(before.webCreditsGranted + 25);
  });

  test("rejects credit adjustments without a reason", async () => {
    const billing = createService();

    try {
      await billing.adjustCredits({
        userId: "user_1",
        source: "web",
        amount: 10,
        reason: "short",
        actorUserId: "admin_1",
      });
      throw new Error("expected validation error");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe(APP_ERROR_CODES.VALIDATION_ERROR);
      }
    }
  });

  test("blocks Free users from Pro-only tools and allows Pro", async () => {
    const freeBilling = createService();

    try {
      await freeBilling.assertCanUseTool({
        userId: "user_1",
        toolId: "ocr-pdf",
      });
      throw new Error("expected Pro-only tool to be blocked");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe(APP_ERROR_CODES.PLAN_LIMIT_REACHED);
      }
    }

    await freeBilling.assertCanUseTool({
      userId: "user_1",
      toolId: "merge-pdf",
    });

    const repository = createMemoryBillingRepository({
      userEmails: { user_1: "user@example.com" },
    });
    await seedProSubscription(repository);
    const proBilling = createBillingService({
      repository,
      config: loadBillingConfig({
        POLAR_ACCESS_TOKEN: "polar_at_test",
        POLAR_WEBHOOK_SECRET: "whsec_test",
        POLAR_PRO_PRODUCT_ID: "prod_pro",
        APP_URL: "https://app.example",
      }),
      polarClient: createPolarClientMock(),
      now: () => now,
    });

    await proBilling.assertCanUseTool({
      userId: "user_1",
      toolId: "ocr-pdf",
    });
  });

  test("loads Polar catalog prices by product ID into billing status", async () => {
    const billing = createService({
      env: {
        POLAR_API_STARTER_PRODUCT_ID: "prod_starter",
        POLAR_API_STARTER_YEARLY_PRODUCT_ID: "prod_starter_yearly",
      },
      polarClient: createPolarClientMock({
        async getProduct(id) {
          if (id === "prod_pro") {
            return {
              prices: [
                { amountType: "fixed", priceAmount: 1200, isArchived: false },
              ],
            };
          }

          if (id === "prod_starter") {
            return {
              prices: [
                { amountType: "fixed", priceAmount: 1500, isArchived: false },
              ],
            };
          }

          if (id === "prod_starter_yearly") {
            return {
              prices: [
                { amountType: "fixed", priceAmount: 14400, isArchived: false },
              ],
            };
          }

          return null;
        },
      }),
    });
    const status = await billing.getBillingStatus({
      userId: "user_1",
      storageUsedBytes: 0,
      apiKeyCount: 0,
    });
    const serialized = JSON.stringify(status);

    expect(status.prices.pro.monthlyUsd).toBe(12);
    expect(status.prices.starter.monthlyUsd).toBe(15);
    expect(status.prices.starter.yearlyUsd).toBe(144);
    expect(status.prices.growth.monthlyUsd).toBe(29);
    expect(serialized).not.toContain("prod_");
    expect(serialized).not.toContain("polar_at_test");
  });
});
