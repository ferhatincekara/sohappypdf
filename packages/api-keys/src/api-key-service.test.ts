import { describe, expect, test } from "bun:test";
import { isAppError } from "@sohappypdf/core";
import { API_KEY_LAST_USED_UPDATE_INTERVAL_MS } from "./api-key-last-used.js";
import type { ApiKeyRepository } from "./api-key-repository.js";
import { hashApiKey, isApiKeyFormat } from "./api-key-secret.js";
import { createApiKeyService } from "./api-key-service.js";
import type { StoredApiKeyRecord } from "./api-key-types.js";

function createMemoryRepository(
  seed: StoredApiKeyRecord[] = [],
): ApiKeyRepository & { records: Map<string, StoredApiKeyRecord> } {
  const records = new Map<string, StoredApiKeyRecord>(
    seed.map((record) => [record.id, { ...record }]),
  );

  return {
    records,
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
    async touchLastUsedAt(input) {
      const record = records.get(input.id);

      if (record === undefined) {
        return;
      }

      if (
        record.lastUsedAt !== null &&
        input.now.getTime() - record.lastUsedAt.getTime() < input.minIntervalMs
      ) {
        return;
      }

      records.set(input.id, {
        ...record,
        lastUsedAt: input.now,
        updatedAt: input.now,
      });
    },
  };
}

function createService(options?: {
  repository?: ApiKeyRepository;
  now?: () => Date;
}) {
  return createApiKeyService({
    repository: options?.repository ?? createMemoryRepository(),
    now: options?.now,
  });
}

describe("createApiKeyService", () => {
  test("returns the raw key only during creation and stores a hash", async () => {
    const repository = createMemoryRepository();
    const service = createService({ repository });
    const created = await service.create({
      userId: "user_1",
      name: "CI",
    });

    expect(isApiKeyFormat(created.secret)).toBe(true);
    expect(created.apiKey).not.toHaveProperty("keyHash");
    expect(created.apiKey).not.toHaveProperty("secret");
    expect(JSON.stringify(created.apiKey).includes(created.secret)).toBe(false);

    const stored = [...repository.records.values()][0];

    expect(stored).toBeDefined();
    if (stored === undefined) {
      throw new Error("expected stored API key");
    }

    expect(stored.keyHash).toBe(hashApiKey(created.secret));
    expect(JSON.stringify(stored).includes(created.secret)).toBe(false);
  });

  test("authenticates a valid key as a stable principal", async () => {
    const service = createService();
    const created = await service.create({
      userId: "user_1",
      name: "CI",
    });

    await expect(service.authenticate(created.secret)).resolves.toEqual({
      userId: "user_1",
      apiKeyId: created.apiKey.id,
    });
  });

  test("rejects unknown, revoked, and expired keys the same way", async () => {
    let currentTime = new Date("2026-01-01T00:00:00.000Z");
    const service = createService({
      now: () => currentTime,
    });
    const created = await service.create({
      userId: "user_1",
      name: "CI",
      expiresAt: new Date("2026-01-02T00:00:00.000Z"),
    });

    await expect(service.authenticate("not-a-key")).resolves.toBeNull();
    await expect(
      service.authenticate(`${created.secret}x`),
    ).resolves.toBeNull();

    await service.revoke({
      id: created.apiKey.id,
      userId: "user_1",
    });
    await expect(service.authenticate(created.secret)).resolves.toBeNull();

    const expiring = await service.create({
      userId: "user_1",
      name: "Temporary",
      expiresAt: new Date("2026-01-02T00:00:00.000Z"),
    });
    currentTime = new Date("2026-01-03T00:00:00.000Z");
    await expect(service.authenticate(expiring.secret)).resolves.toBeNull();
  });

  test("lists metadata without secret material", async () => {
    const service = createService();
    const created = await service.create({
      userId: "user_1",
      name: "CI",
    });

    const listed = await service.listByUserId("user_1");

    expect(listed).toEqual([created.apiKey]);
    expect(JSON.stringify(listed).includes(created.secret)).toBe(false);
    expect(JSON.stringify(listed).includes("keyHash")).toBe(false);
  });

  test("revokes a key idempotently and keeps it unusable", async () => {
    const service = createService();
    const created = await service.create({
      userId: "user_1",
      name: "CI",
    });

    const revoked = await service.revoke({
      id: created.apiKey.id,
      userId: "user_1",
    });
    const revokedAgain = await service.revoke({
      id: created.apiKey.id,
      userId: "user_1",
    });

    expect(revoked.revokedAt).not.toBeNull();
    expect(revokedAgain.revokedAt).toEqual(revoked.revokedAt);
    await expect(service.authenticate(created.secret)).resolves.toBeNull();
  });

  test("does not reveal another user's key on revoke", async () => {
    const service = createService();
    const created = await service.create({
      userId: "user_1",
      name: "CI",
    });

    try {
      await service.revoke({
        id: created.apiKey.id,
        userId: "user_2",
      });
      throw new Error("expected revoke to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("NOT_FOUND");
      }
    }
  });

  test("updates lastUsedAt after the configured interval only", async () => {
    let currentTime = new Date("2026-01-01T00:00:00.000Z");
    const repository = createMemoryRepository();
    const service = createService({
      repository,
      now: () => currentTime,
    });
    const created = await service.create({
      userId: "user_1",
      name: "CI",
    });

    await service.authenticate(created.secret);
    const firstUsed = [...repository.records.values()][0]?.lastUsedAt;
    expect(firstUsed).toEqual(currentTime);

    currentTime = new Date(
      currentTime.getTime() + API_KEY_LAST_USED_UPDATE_INTERVAL_MS - 1,
    );
    await service.authenticate(created.secret);
    expect([...repository.records.values()][0]?.lastUsedAt).toEqual(firstUsed);

    currentTime = new Date(
      currentTime.getTime() + API_KEY_LAST_USED_UPDATE_INTERVAL_MS,
    );
    await service.authenticate(created.secret);
    expect([...repository.records.values()][0]?.lastUsedAt).toEqual(
      currentTime,
    );
  });

  test("does not fail authentication when lastUsedAt cannot be updated", async () => {
    const repository = createMemoryRepository();
    repository.touchLastUsedAt = async () => {
      throw new Error("database unavailable");
    };
    const service = createService({ repository });
    const created = await service.create({
      userId: "user_1",
      name: "CI",
    });

    await expect(service.authenticate(created.secret)).resolves.toEqual({
      userId: "user_1",
      apiKeyId: created.apiKey.id,
    });
  });
});
