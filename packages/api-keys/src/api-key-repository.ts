import { APP_ERROR_CODES, AppError } from "@repo/core";
import { apiKeys, type Database } from "@repo/db";
import { and, desc, eq, isNull, lte, or } from "drizzle-orm";
import type { StoredApiKeyRecord } from "./api-key-types.js";

export type ApiKeyRepository = {
  insert(record: StoredApiKeyRecord): Promise<StoredApiKeyRecord>;
  findByPrefix(keyPrefix: string): Promise<StoredApiKeyRecord | undefined>;
  findByIdForUser(
    id: string,
    userId: string,
  ): Promise<StoredApiKeyRecord | undefined>;
  listByUserId(userId: string): Promise<StoredApiKeyRecord[]>;
  revoke(input: {
    id: string;
    userId: string;
    now: Date;
  }): Promise<StoredApiKeyRecord | undefined>;
  touchLastUsedAt(input: {
    id: string;
    now: Date;
    minIntervalMs: number;
  }): Promise<void>;
};

function toStoredRecord(row: typeof apiKeys.$inferSelect): StoredApiKeyRecord {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    keyPrefix: row.keyPrefix,
    keyHash: row.keyHash,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    lastUsedAt: row.lastUsedAt,
    expiresAt: row.expiresAt,
    revokedAt: row.revokedAt,
  };
}

export function createApiKeyRepository(db: Database): ApiKeyRepository {
  return {
    async insert(record) {
      const [row] = await db
        .insert(apiKeys)
        .values({
          id: record.id,
          userId: record.userId,
          name: record.name,
          keyPrefix: record.keyPrefix,
          keyHash: record.keyHash,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          lastUsedAt: record.lastUsedAt,
          expiresAt: record.expiresAt,
          revokedAt: record.revokedAt,
        })
        .returning();

      if (row === undefined) {
        throw new AppError({
          code: APP_ERROR_CODES.INTERNAL_ERROR,
          message: "Failed to create API key",
        });
      }

      return toStoredRecord(row);
    },

    async findByPrefix(keyPrefix) {
      const [row] = await db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.keyPrefix, keyPrefix))
        .limit(1);

      if (row === undefined) {
        return undefined;
      }

      return toStoredRecord(row);
    },

    async findByIdForUser(id, userId) {
      const [row] = await db
        .select()
        .from(apiKeys)
        .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)))
        .limit(1);

      if (row === undefined) {
        return undefined;
      }

      return toStoredRecord(row);
    },

    async listByUserId(userId) {
      const rows = await db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.userId, userId))
        .orderBy(desc(apiKeys.createdAt));

      return rows.map((row) => toStoredRecord(row));
    },

    async revoke(input) {
      const [row] = await db
        .update(apiKeys)
        .set({
          revokedAt: input.now,
          updatedAt: input.now,
        })
        .where(
          and(
            eq(apiKeys.id, input.id),
            eq(apiKeys.userId, input.userId),
            isNull(apiKeys.revokedAt),
          ),
        )
        .returning();

      if (row === undefined) {
        return undefined;
      }

      return toStoredRecord(row);
    },

    async touchLastUsedAt(input) {
      const staleBefore = new Date(input.now.getTime() - input.minIntervalMs);

      await db
        .update(apiKeys)
        .set({
          lastUsedAt: input.now,
          updatedAt: input.now,
        })
        .where(
          and(
            eq(apiKeys.id, input.id),
            or(
              isNull(apiKeys.lastUsedAt),
              lte(apiKeys.lastUsedAt, staleBefore),
            ),
          ),
        );
    },
  };
}
