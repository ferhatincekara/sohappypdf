import { describe, expect, test } from "bun:test";
import {
  type ApiKeyRepository,
  createApiKeyService,
  type StoredApiKeyRecord,
} from "@sohappypdf/api-keys";
import {
  createBillingService,
  createMemoryBillingRepository,
  type PolarClient,
} from "@sohappypdf/billing";
import { loadBillingConfig } from "@sohappypdf/config";
import { APP_ERROR_CODES } from "@sohappypdf/core";
import {
  createFileService,
  type FileRecord,
  type FileRepository,
  type FileService,
  sumActiveStorageBytesForOwner,
} from "@sohappypdf/files";
import type { Logger } from "@sohappypdf/logger";
import type { Storage } from "@sohappypdf/storage";
import { createApp } from "../../app.js";
import type { RequestIdentity } from "../../auth/request-identity.js";

const silentLogger: Logger = {
  level: "error",
  error() {},
  warn() {},
  info() {},
  debug() {},
  child() {
    return silentLogger;
  },
};

const sessionIdentity: RequestIdentity = {
  kind: "session",
  userId: "user_1",
  sessionId: "session_1",
};

const now = new Date("2026-08-15T12:00:00.000Z");

function createMemoryFileRepository(seed: FileRecord[] = []): FileRepository {
  const records = new Map<string, FileRecord>(
    seed.map((file) => [file.id, { ...file }]),
  );

  return {
    async insert(file) {
      records.set(file.id, { ...file });
      return { ...file };
    },
    async findById(id) {
      const file = records.get(id);
      return file === undefined ? undefined : { ...file };
    },
    async listByOwner() {
      return [];
    },
    async updateStatus() {
      return undefined;
    },
    async markDeleted() {
      return undefined;
    },
    async deleteById(id) {
      records.delete(id);
    },
    async markPurged() {
      return undefined;
    },
    async listEligibleForCleanup() {
      return [];
    },
    async listPurged() {
      return [];
    },
    async sumActiveStorageBytes(ownerId, currentTime) {
      return sumActiveStorageBytesForOwner(
        [...records.values()],
        ownerId,
        currentTime,
      );
    },
    async transferOwner(input) {
      let transferred = 0;

      for (const [id, file] of records.entries()) {
        if (
          file.ownerId !== input.fromOwnerId ||
          (file.ownerKind ?? "user") !== input.fromOwnerKind
        ) {
          continue;
        }

        records.set(id, {
          ...file,
          ownerId: input.toOwnerId,
          ownerKind: input.toOwnerKind,
          updatedAt: input.now,
        });
        transferred += 1;
      }

      return { transferred };
    },
  };
}

function createMemoryStorage(): Storage {
  return {
    async uploadObject() {
      return { key: "files/original/test" };
    },
    async uploadObjectFromFile() {
      return { key: "files/original/test" };
    },
    async downloadObjectToFile(input) {
      return { key: input.key, sizeBytes: 0 };
    },
    async ping() {},
    async createPresignedUploadUrl(input) {
      return {
        key: input.key,
        expiresInSeconds: 900,
        url: `https://example.invalid/${input.key}`,
      };
    },
    async createPresignedDownloadUrl(input) {
      return {
        key: input.key,
        expiresInSeconds: 900,
        url: `https://example.invalid/${input.key}`,
      };
    },
    async deleteObject() {},
    async objectExists() {
      return true;
    },
    async getObject() {
      return { key: "files/original/test", body: new Uint8Array() };
    },
    async getObjectMetadata() {
      return { key: "files/original/test", contentLength: 1 };
    },
  };
}

function createMemoryApiKeyRepository(
  seed: StoredApiKeyRecord[] = [],
): ApiKeyRepository {
  const records = new Map<string, StoredApiKeyRecord>(
    seed.map((record) => [record.id, { ...record }]),
  );

  return {
    async insert(record) {
      records.set(record.id, { ...record });
      return { ...record };
    },
    async findByPrefix() {
      return undefined;
    },
    async findByIdForUser() {
      return undefined;
    },
    async listByUserId(userId) {
      return [...records.values()].filter((record) => record.userId === userId);
    },
    async revoke() {
      return undefined;
    },
    async touchLastUsedAt() {},
  };
}

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

function createBillingApp(options?: {
  identity?: RequestIdentity;
  fileService?: FileService;
  repository?: ReturnType<typeof createMemoryBillingRepository>;
  polarClient?: PolarClient;
  env?: Record<string, string | undefined>;
}) {
  const repository =
    options?.repository ??
    createMemoryBillingRepository({
      userEmails: { user_1: "user@example.com" },
    });
  const billingService = createBillingService({
    repository,
    config: loadBillingConfig({
      POLAR_ACCESS_TOKEN: "polar_at_test",
      POLAR_WEBHOOK_SECRET: "whsec_test",
      POLAR_PRO_PRODUCT_ID: "prod_pro",
      APP_URL: "https://app.example",
      ...options?.env,
    }),
    polarClient: options?.polarClient ?? createPolarClientMock(),
    verifyWebhook: (_body, _headers, _secret) => ({
      id: "evt_test",
      type: "subscription.active",
      data: {
        id: "sub_polar_1",
        status: "active",
        productId: "prod_pro",
        customerId: "cus_1",
        externalCustomerId: "user_1",
      },
    }),
    now: () => now,
  });

  return createApp({
    config: { corsOrigins: [] },
    logger: silentLogger,
    resolveIdentity: async () => options?.identity ?? sessionIdentity,
    fileService:
      options?.fileService ??
      createFileService({
        repository: createMemoryFileRepository(),
        storage: createMemoryStorage(),
        now: () => now,
      }),
    apiKeyService: createApiKeyService({
      repository: createMemoryApiKeyRepository(),
    }),
    billingService,
  });
}

describe("billing API", () => {
  test("rejects unauthenticated billing access", async () => {
    const app = createBillingApp({ identity: { kind: "anonymous" } });
    const response = await app.request("/v1/billing");

    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe(
      APP_ERROR_CODES.UNAUTHORIZED,
    );
  });

  test("returns Polar catalog prices without authentication or Polar IDs", async () => {
    const app = createBillingApp({
      identity: { kind: "anonymous" },
      env: {
        POLAR_API_STARTER_PRODUCT_ID: "prod_starter",
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

          return null;
        },
      }),
    });
    const response = await app.request("/v1/billing/catalog");
    const body = await response.json();
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(200);
    expect(body.prices.pro.monthlyUsd).toBe(12);
    expect(body.prices.starter.monthlyUsd).toBe(15);
    expect(serialized).not.toContain("prod_");
    expect(serialized).not.toContain("polar_at_test");
  });

  test("returns the free billing status for a user without a subscription", async () => {
    const app = createBillingApp();
    const response = await app.request("/v1/billing");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.billing.plan).toBe("free");
    expect(body.billing.canUpgrade).toBe(true);
    expect(body.billing.canManage).toBe(false);
    expect(body.billing.usage.webCreditsLimit).toBe(1_550);
    expect(body.billing.usage.webCreditsRemaining).toBe(1_550);
    expect(body.billing.usage.aiCreditsLimit).toBe(0);
    expect(body.billing.usage.conversionsLimit).toBe(5);
    expect(body.billing.api.creditsLimit).toBe(100);
    expect(body.billing.prices.pro.monthlyUsd).toBe(5);
    expect(JSON.stringify(body).includes("polar_at_test")).toBe(false);
  });

  test("creates a Polar checkout session", async () => {
    const app = createBillingApp();
    const response = await app.request("/v1/billing/checkout", {
      method: "POST",
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.checkout.url).toBe("https://polar.example/checkout/cs_1");
  });

  test("creates an API starter checkout from a product key", async () => {
    let productId: string | undefined;
    const app = createBillingApp({
      env: {
        POLAR_API_STARTER_PRODUCT_ID: "prod_starter",
      },
      polarClient: createPolarClientMock({
        async createCheckout(input) {
          productId = input.productIds[0];
          return { url: "https://polar.example/checkout/starter" };
        },
      }),
    });

    const response = await app.request("/v1/billing/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ product: "api-starter" }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.checkout.url).toBe("https://polar.example/checkout/starter");
    expect(productId).toBe("prod_starter");
  });

  test("creates a yearly API starter checkout from the selected interval", async () => {
    let productIds: readonly string[] | undefined;
    const app = createBillingApp({
      env: {
        POLAR_API_STARTER_PRODUCT_ID: "prod_starter",
        POLAR_API_STARTER_YEARLY_PRODUCT_ID: "prod_starter_yearly",
      },
      polarClient: createPolarClientMock({
        async createCheckout(input) {
          productIds = input.productIds;
          return { url: "https://polar.example/checkout/starter-yearly" };
        },
      }),
    });

    const response = await app.request("/v1/billing/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ product: "api-starter", interval: "yearly" }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.checkout.url).toBe(
      "https://polar.example/checkout/starter-yearly",
    );
    expect(productIds).toEqual(["prod_starter_yearly"]);
  });

  test("activates Pro after a verified webhook", async () => {
    const repository = createMemoryBillingRepository({
      userEmails: { user_1: "user@example.com" },
    });
    const app = createBillingApp({
      repository,
      polarClient: createPolarClientMock({
        async listSubscriptionsByExternalId() {
          return [
            {
              id: "sub_polar_1",
              status: "active",
              productId: "prod_pro",
              customerId: "cus_1",
              externalCustomerId: "user_1",
            },
          ];
        },
      }),
    });

    const webhook = await app.request("/v1/billing/webhooks", {
      method: "POST",
      headers: {
        "webhook-id": "evt_test",
        "webhook-timestamp": "1",
        "webhook-signature": "v1,test",
      },
      body: "{}",
    });
    const status = await app.request("/v1/billing");
    const body = await status.json();

    expect(webhook.status).toBe(202);
    expect(body.billing.plan).toBe("pro");
    expect(body.billing.canUpgrade).toBe(false);
  });

  test("activates Pro after Polar subscription reconcile", async () => {
    const app = createBillingApp({
      polarClient: createPolarClientMock({
        async listSubscriptionsByExternalId() {
          return [
            {
              id: "sub_polar_1",
              status: "active",
              productId: "prod_pro",
              customerId: "cus_1",
              externalCustomerId: "user_1",
            },
          ];
        },
      }),
    });
    const response = await app.request("/v1/billing");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.billing.plan).toBe("pro");
    expect(body.billing.canUpgrade).toBe(false);
  });
});
