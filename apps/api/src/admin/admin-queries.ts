import {
  anonymousSessions,
  conversions,
  type Database,
  getDb,
  user,
} from "@repo/db";
import { and, count, eq, isNotNull, lt } from "drizzle-orm";
import type { AdminActor } from "./admin-actor.js";

export type AdminExecutionCounts = {
  pending: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
  expiredReady: number;
};

export type AdminOverview = {
  users: number;
  anonymousSessions: number;
  executions: AdminExecutionCounts;
};

export type AdminQueryService = {
  findActorByUserId(userId: string): Promise<AdminActor | null>;
  getOverview(now?: Date): Promise<AdminOverview>;
};

function toCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

export const EMPTY_EXECUTION_COUNTS: AdminExecutionCounts = {
  pending: 0,
  queued: 0,
  processing: 0,
  completed: 0,
  failed: 0,
  cancelled: 0,
  expiredReady: 0,
};

export function createAdminQueryService(
  db: Database = getDb(),
): AdminQueryService {
  return {
    async findActorByUserId(userId) {
      const [row] = await db
        .select({
          userId: user.id,
          email: user.email,
          name: user.name,
        })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      if (row === undefined) {
        return null;
      }

      return {
        userId: row.userId,
        email: row.email,
        name: row.name,
      };
    },

    async getOverview(now = new Date()) {
      const [userCount] = await db.select({ value: count() }).from(user);
      const [sessionCount] = await db
        .select({ value: count() })
        .from(anonymousSessions);
      const statusRows = await db
        .select({
          status: conversions.status,
          value: count(),
        })
        .from(conversions)
        .groupBy(conversions.status);
      const [expiredReady] = await db
        .select({ value: count() })
        .from(conversions)
        .where(
          and(
            eq(conversions.status, "completed"),
            isNotNull(conversions.expiresAt),
            lt(conversions.expiresAt, now),
          ),
        );

      const executions: AdminExecutionCounts = { ...EMPTY_EXECUTION_COUNTS };

      for (const row of statusRows) {
        if (row.status === "pending") {
          executions.pending = toCount(row.value);
        } else if (row.status === "queued") {
          executions.queued = toCount(row.value);
        } else if (row.status === "processing") {
          executions.processing = toCount(row.value);
        } else if (row.status === "completed") {
          executions.completed = toCount(row.value);
        } else if (row.status === "failed") {
          executions.failed = toCount(row.value);
        } else if (row.status === "cancelled") {
          executions.cancelled = toCount(row.value);
        }
      }

      executions.expiredReady = toCount(expiredReady?.value);

      return {
        users: toCount(userCount?.value),
        anonymousSessions: toCount(sessionCount?.value),
        executions,
      };
    },
  };
}

export function createMemoryAdminQueryService(options?: {
  actors?: readonly AdminActor[];
  overview?: AdminOverview;
}): AdminQueryService {
  const actors = options?.actors ?? [];
  const overview = options?.overview ?? {
    users: 0,
    anonymousSessions: 0,
    executions: { ...EMPTY_EXECUTION_COUNTS },
  };

  return {
    async findActorByUserId(userId) {
      return actors.find((actor) => actor.userId === userId) ?? null;
    },
    async getOverview() {
      return overview;
    },
  };
}
