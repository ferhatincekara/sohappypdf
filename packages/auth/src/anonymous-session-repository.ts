import { APP_ERROR_CODES, AppError } from "@repo/core";
import { anonymousSessions, type Database } from "@repo/db";
import { and, eq, lte } from "drizzle-orm";
import type {
  AnonymousSessionRecord,
  AnonymousSessionRepository,
} from "./anonymous-session-types.js";

function toAnonymousSessionRecord(
  row: typeof anonymousSessions.$inferSelect,
): AnonymousSessionRecord {
  return {
    id: row.id,
    tokenHash: row.tokenHash,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    lastSeenAt: row.lastSeenAt,
  };
}

export function createAnonymousSessionRepository(
  db: Database,
): AnonymousSessionRepository {
  return {
    async insert(session) {
      const [row] = await db
        .insert(anonymousSessions)
        .values({
          id: session.id,
          tokenHash: session.tokenHash,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
          lastSeenAt: session.lastSeenAt,
        })
        .returning();

      if (row === undefined) {
        throw new AppError({
          code: APP_ERROR_CODES.INTERNAL_ERROR,
          message: "Failed to create anonymous session",
        });
      }

      return toAnonymousSessionRecord(row);
    },

    async findByTokenHash(tokenHash) {
      const [row] = await db
        .select()
        .from(anonymousSessions)
        .where(eq(anonymousSessions.tokenHash, tokenHash))
        .limit(1);

      if (row === undefined) {
        return undefined;
      }

      return toAnonymousSessionRecord(row);
    },

    async findById(id) {
      const [row] = await db
        .select()
        .from(anonymousSessions)
        .where(eq(anonymousSessions.id, id))
        .limit(1);

      if (row === undefined) {
        return undefined;
      }

      return toAnonymousSessionRecord(row);
    },

    async deleteExpired(input) {
      const expired = await db
        .select({ id: anonymousSessions.id })
        .from(anonymousSessions)
        .where(lte(anonymousSessions.expiresAt, input.now))
        .limit(input.limit);

      if (expired.length === 0) {
        return 0;
      }

      let deleted = 0;

      for (const row of expired) {
        await db
          .delete(anonymousSessions)
          .where(
            and(
              eq(anonymousSessions.id, row.id),
              lte(anonymousSessions.expiresAt, input.now),
            ),
          );
        deleted += 1;
      }

      return deleted;
    },
  };
}
