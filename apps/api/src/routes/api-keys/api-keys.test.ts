import { describe, expect, test } from "bun:test";
import {
  type ApiKeyRepository,
  type ApiKeyService,
  createApiKeyService,
  isApiKeyFormat,
  type StoredApiKeyRecord,
} from "@sohappypdf/api-keys";
import {
  type BillingService,
  createTestBillingService,
  DEFAULT_PLAN_LIMITS,
} from "@sohappypdf/billing";
import { APP_ERROR_CODES } from "@sohappypdf/core";
import type { Logger } from "@sohappypdf/logger";
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

function createMemoryRepository(
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
    async findByPrefix(keyPrefix) {
      const record = [...records.values()].find(
        (item) => item.keyPrefix === keyPrefix,
      );
      return record === undefined ? undefined : { ...record };
    },
    async findByIdForUser(id, userId) {
      const record = records.get(id);

      if (record === undefined || record.userId !== userId) {
        return undefined;
      }

      return { ...record };
    },
    async listByUserId(userId) {
      return [...records.values()]
        .filter((record) => record.userId === userId)
        .sort(
          (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
        )
        .map((record) => ({ ...record }));
    },
    async revoke(input) {
      const record = records.get(input.id);

      if (
        record === undefined ||
        record.userId !== input.userId ||
        record.revokedAt !== null
      ) {
        return undefined;
      }

      const updated = {
        ...record,
        revokedAt: input.now,
        updatedAt: input.now,
      };
      records.set(input.id, updated);
      return { ...updated };
    },
    async touchLastUsedAt() {},
  };
}

function createApiKeyApp(options: {
  identity: RequestIdentity;
  apiKeyService?: ApiKeyService;
  billingService?: BillingService;
}) {
  return createApp({
    config: { corsOrigins: [] },
    logger: silentLogger,
    resolveIdentity: async () => options.identity,
    apiKeyService:
      options.apiKeyService ??
      createApiKeyService({
        repository: createMemoryRepository(),
      }),
    billingService: options.billingService ?? createTestBillingService(),
  });
}

const sessionIdentity: RequestIdentity = {
  kind: "session",
  userId: "user_1",
  sessionId: "session_1",
};

const otherSessionIdentity: RequestIdentity = {
  kind: "session",
  userId: "user_2",
  sessionId: "session_2",
};

const apiKeyIdentity: RequestIdentity = {
  kind: "api-key",
  userId: "user_1",
  apiKeyId: "key_1",
};

describe("API key management API", () => {
  test("requires a session to manage API keys", async () => {
    const anonymous = createApiKeyApp({ identity: { kind: "anonymous" } });
    const withApiKey = createApiKeyApp({ identity: apiKeyIdentity });

    const unauthenticated = await anonymous.request("/v1/api-keys");
    const programmatic = await withApiKey.request("/v1/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "CI" }),
    });

    expect(unauthenticated.status).toBe(401);
    expect(programmatic.status).toBe(403);
  });

  test("creates a key and returns the raw secret only once", async () => {
    const apiKeyService = createApiKeyService({
      repository: createMemoryRepository(),
    });
    const app = createApiKeyApp({
      identity: sessionIdentity,
      apiKeyService,
    });

    const createdResponse = await app.request("/v1/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "  Production  " }),
    });
    const createdBody = await createdResponse.json();

    expect(createdResponse.status).toBe(201);
    expect(isApiKeyFormat(createdBody.secret)).toBe(true);
    expect(createdBody.apiKey.name).toBe("Production");
    expect(createdBody.apiKey.status).toBe("active");
    expect(createdBody.apiKey.keyPrefix).toStartWith("shpdf_");
    expect(createdBody.apiKey).not.toHaveProperty("keyHash");
    expect(createdBody.apiKey).not.toHaveProperty("userId");
    expect(createdBody.apiKey).not.toHaveProperty("secret");

    const listedResponse = await app.request("/v1/api-keys");
    const listedBody = await listedResponse.json();

    expect(listedResponse.status).toBe(200);
    expect(listedBody.apiKeys).toHaveLength(1);
    expect(listedBody.apiKeys[0]).toEqual(createdBody.apiKey);
    expect(JSON.stringify(listedBody).includes(createdBody.secret)).toBe(false);
    expect(JSON.stringify(listedBody).includes("keyHash")).toBe(false);
  });

  test("rejects empty and oversized names", async () => {
    const app = createApiKeyApp({ identity: sessionIdentity });

    const empty = await app.request("/v1/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "   " }),
    });
    const oversized = await app.request("/v1/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "a".repeat(81) }),
    });

    expect(empty.status).toBe(400);
    expect(oversized.status).toBe(400);
    expect((await empty.json()).error.code).toBe(
      APP_ERROR_CODES.VALIDATION_ERROR,
    );
  });

  test("lists only the authenticated user's keys and includes revoked ones", async () => {
    const apiKeyService = createApiKeyService({
      repository: createMemoryRepository(),
    });
    const ownerApp = createApiKeyApp({
      identity: sessionIdentity,
      apiKeyService,
    });
    const otherApp = createApiKeyApp({
      identity: otherSessionIdentity,
      apiKeyService,
    });

    const created = await ownerApp.request("/v1/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "CI" }),
    });
    const createdBody = await created.json();
    await ownerApp.request(`/v1/api-keys/${createdBody.apiKey.id}`, {
      method: "DELETE",
    });
    await otherApp.request("/v1/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Other" }),
    });

    const listed = await ownerApp.request("/v1/api-keys");
    const listedBody = await listed.json();

    expect(listedBody.apiKeys).toHaveLength(1);
    expect(listedBody.apiKeys[0].name).toBe("CI");
    expect(listedBody.apiKeys[0].status).toBe("revoked");
  });

  test("revokes an owned key and hides another user's key", async () => {
    const apiKeyService = createApiKeyService({
      repository: createMemoryRepository(),
    });
    const ownerApp = createApiKeyApp({
      identity: sessionIdentity,
      apiKeyService,
    });
    const otherApp = createApiKeyApp({
      identity: otherSessionIdentity,
      apiKeyService,
    });

    const created = await ownerApp.request("/v1/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "CI" }),
    });
    const createdBody = await created.json();
    const foreign = await otherApp.request(
      `/v1/api-keys/${createdBody.apiKey.id}`,
      { method: "DELETE" },
    );
    const revoked = await ownerApp.request(
      `/v1/api-keys/${createdBody.apiKey.id}`,
      { method: "DELETE" },
    );
    const revokedBody = await revoked.json();

    expect(foreign.status).toBe(404);
    expect(revoked.status).toBe(200);
    expect(revokedBody.apiKey.status).toBe("revoked");
    expect(revokedBody.apiKey).not.toHaveProperty("secret");
  });

  test("rejects extra API keys after the current plan limit", async () => {
    const apiKeyService = createApiKeyService({
      repository: createMemoryRepository(),
    });
    const app = createApiKeyApp({
      identity: sessionIdentity,
      apiKeyService,
      billingService: createTestBillingService({
        planCatalog: {
          ...DEFAULT_PLAN_LIMITS,
          free: {
            ...DEFAULT_PLAN_LIMITS.free,
            maxApiKeys: 1,
          },
        },
      }),
    });

    const first = await app.request("/v1/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "First" }),
    });
    const second = await app.request("/v1/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Second" }),
    });

    expect(first.status).toBe(201);
    expect(second.status).toBe(403);
    expect(await second.json()).toMatchObject({
      error: { code: APP_ERROR_CODES.API_KEY_LIMIT_REACHED },
    });
  });
});
