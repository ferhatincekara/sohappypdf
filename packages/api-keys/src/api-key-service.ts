import { randomUUID } from "node:crypto";
import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import { API_KEY_LAST_USED_UPDATE_INTERVAL_MS } from "./api-key-last-used.js";
import type { ApiKeyRepository } from "./api-key-repository.js";
import {
  apiKeyHashesEqual,
  extractApiKeyPrefix,
  generateApiKeySecret,
  hashApiKey,
  isApiKeyFormat,
} from "./api-key-secret.js";
import type {
  ApiKeyPublicRecord,
  AuthenticatedApiKey,
  CreateApiKeyInput,
  CreatedApiKey,
  RevokeApiKeyInput,
  StoredApiKeyRecord,
} from "./api-key-types.js";
import {
  assertApiKeyExpiration,
  assertApiKeyId,
  assertApiKeyName,
  assertApiKeyUserId,
} from "./api-key-validation.js";

export type ApiKeyServiceOptions = {
  repository: ApiKeyRepository;
  now?: () => Date;
  lastUsedUpdateIntervalMs?: number;
};

export type ApiKeyService = {
  create(input: CreateApiKeyInput): Promise<CreatedApiKey>;
  listByUserId(userId: string): Promise<ApiKeyPublicRecord[]>;
  revoke(input: RevokeApiKeyInput): Promise<ApiKeyPublicRecord>;
  authenticate(rawKey: string): Promise<AuthenticatedApiKey | null>;
};

export function toApiKeyPublicRecord(
  record: StoredApiKeyRecord,
): ApiKeyPublicRecord {
  return {
    id: record.id,
    userId: record.userId,
    name: record.name,
    keyPrefix: record.keyPrefix,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    lastUsedAt: record.lastUsedAt,
    expiresAt: record.expiresAt,
    revokedAt: record.revokedAt,
  };
}

function isUsableApiKey(record: StoredApiKeyRecord, now: Date): boolean {
  if (record.revokedAt !== null) {
    return false;
  }

  if (
    record.expiresAt !== null &&
    record.expiresAt.getTime() <= now.getTime()
  ) {
    return false;
  }

  return true;
}

export function createApiKeyService(
  options: ApiKeyServiceOptions,
): ApiKeyService {
  const now = options.now ?? (() => new Date());
  const lastUsedUpdateIntervalMs =
    options.lastUsedUpdateIntervalMs ?? API_KEY_LAST_USED_UPDATE_INTERVAL_MS;

  return {
    async create(input) {
      const createdAt = now();
      const generated = generateApiKeySecret();
      const record: StoredApiKeyRecord = {
        id: randomUUID(),
        userId: assertApiKeyUserId(input.userId),
        name: assertApiKeyName(input.name),
        keyPrefix: generated.keyPrefix,
        keyHash: hashApiKey(generated.rawKey),
        createdAt,
        updatedAt: createdAt,
        lastUsedAt: null,
        expiresAt: assertApiKeyExpiration(input.expiresAt, createdAt),
        revokedAt: null,
      };

      const stored = await options.repository.insert(record);

      return {
        apiKey: toApiKeyPublicRecord(stored),
        secret: generated.rawKey,
      };
    },

    async listByUserId(userId) {
      const records = await options.repository.listByUserId(
        assertApiKeyUserId(userId),
      );

      return records.map((record) => toApiKeyPublicRecord(record));
    },

    async revoke(input) {
      const id = assertApiKeyId(input.id);
      const userId = assertApiKeyUserId(input.userId);
      const existing = await options.repository.findByIdForUser(id, userId);

      if (existing === undefined) {
        throw new AppError({
          code: APP_ERROR_CODES.NOT_FOUND,
          message: "API key not found",
        });
      }

      if (existing.revokedAt !== null) {
        return toApiKeyPublicRecord(existing);
      }

      const revoked = await options.repository.revoke({
        id,
        userId,
        now: now(),
      });

      if (revoked === undefined) {
        return toApiKeyPublicRecord(existing);
      }

      return toApiKeyPublicRecord(revoked);
    },

    async authenticate(rawKey) {
      if (!isApiKeyFormat(rawKey)) {
        return null;
      }

      const keyPrefix = extractApiKeyPrefix(rawKey);

      if (keyPrefix === undefined) {
        return null;
      }

      const record = await options.repository.findByPrefix(keyPrefix);

      if (record === undefined) {
        return null;
      }

      if (!apiKeyHashesEqual(record.keyHash, hashApiKey(rawKey))) {
        return null;
      }

      const currentTime = now();

      if (!isUsableApiKey(record, currentTime)) {
        return null;
      }

      try {
        await options.repository.touchLastUsedAt({
          id: record.id,
          now: currentTime,
          minIntervalMs: lastUsedUpdateIntervalMs,
        });
      } catch {
        // lastUsedAt is metadata only. A write failure must not reject a valid key.
      }

      return {
        userId: record.userId,
        apiKeyId: record.id,
      };
    },
  };
}
