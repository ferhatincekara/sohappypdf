import { describe, expect, test } from "bun:test";
import {
  type ApiKeyRepository,
  createApiKeyService,
  type StoredApiKeyRecord,
} from "@repo/api-keys";
import {
  createBillingService,
  createMemoryBillingRepository,
  type PolarClient,
} from "@repo/billing";
import { loadBillingConfig } from "@repo/config";
import { APP_ERROR_CODES } from "@repo/core";
import {
  createFileService,
  type FileRecord,
  type FileRepository,
  type FileService,
  sumActiveStorageBytesForOwner,
} from "@repo/files";
import type { Logger } from "@repo/logger";
import type { Storage } from "@repo/storage";
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
    async listEligibleForCleanup() {
      return [];
    },
    async sumActiveStorageBytes(ownerId, currentTime) {
      return sumActiveStorageBytesForOwner(
        [...records.values()],
        ownerId,
        currentTime,
      );
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

function createPolarClientMock(): PolarClient {
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
  };
}

function createBillingApp(options?: {
  identity?: RequestIdentity;
  fileService?: FileService;
  repository?: ReturnType<typeof createMemoryBillingRepository>;
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
    }),
    polarClient: createPolarClientMock(),
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
    const response = await app.request("/api/v1/billing");

    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe(
      APP_ERROR_CODES.UNAUTHORIZED,
    );
  });

  test("returns the free billing status for a user without a subscription", async () => {
    const app = createBillingApp();
    const response = await app.request("/api/v1/billing");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.billing.plan).toBe("free");
    expect(body.billing.canUpgrade).toBe(true);
    expect(body.billing.usage.conversionsLimit).toBe(20);
    expect(JSON.stringify(body).includes("polar_at_test")).toBe(false);
  });

  test("creates a Polar checkout session", async () => {
    const app = createBillingApp();
    const response = await app.request("/api/v1/billing/checkout", {
      method: "POST",
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.checkout.url).toBe("https://polar.example/checkout/cs_1");
  });

  test("activates Pro after a verified webhook", async () => {
    const repository = createMemoryBillingRepository({
      userEmails: { user_1: "user@example.com" },
    });
    const app = createBillingApp({ repository });

    const webhook = await app.request("/api/v1/billing/webhooks", {
      method: "POST",
      headers: {
        "webhook-id": "evt_test",
        "webhook-timestamp": "1",
        "webhook-signature": "v1,test",
      },
      body: "{}",
    });
    const status = await app.request("/api/v1/billing");
    const body = await status.json();

    expect(webhook.status).toBe(202);
    expect(body.billing.plan).toBe("pro");
    expect(body.billing.canUpgrade).toBe(false);
  });
});
