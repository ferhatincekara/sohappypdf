import {
  anonymousSessions,
  conversions,
  type Database,
  getDb,
  user,
} from "@repo/db";
import { and, count, desc, eq, ilike, isNotNull, lt, or } from "drizzle-orm";
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

export type AdminUserSummary = {
  userId: string;
  email: string;
  name: string;
  createdAt: string;
  plan: "free" | "pro" | null;
};

export type AdminUserRecord = {
  userId: string;
  email: string;
  name: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminExecutionRecord = {
  id: string;
  ownerId: string;
  ownerKind: string;
  tool: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  expiresAt: string | null;
};

export type AdminAnonymousSessionRecord = {
  id: string;
  createdAt: string;
  expiresAt: string;
  lastSeenAt: string;
};

export type AdminQueryService = {
  findActorByUserId(userId: string): Promise<AdminActor | null>;
  getOverview(now?: Date): Promise<AdminOverview>;
  listUsers(input: {
    limit: number;
    query?: string;
  }): Promise<AdminUserSummary[]>;
  getUser(userId: string): Promise<AdminUserRecord | null>;
  listExecutionsForOwner(input: {
    ownerId: string;
    limit: number;
  }): Promise<AdminExecutionRecord[]>;
  listAnonymousSessions(input: {
    limit: number;
  }): Promise<AdminAnonymousSessionRecord[]>;
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

    async listUsers(input) {
      const limit = Math.min(Math.max(input.limit, 1), 100);
      const rawQuery = input.query?.trim() ?? "";
      const needle = rawQuery.replaceAll("%", "").replaceAll("_", "");
      const filters =
        needle.length === 0
          ? undefined
          : or(
              ilike(user.email, `%${needle}%`),
              ilike(user.name, `%${needle}%`),
            );
      const rows = await db
        .select({
          userId: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        })
        .from(user)
        .where(filters)
        .orderBy(desc(user.createdAt))
        .limit(limit);

      return rows.map((row) => ({
        userId: row.userId,
        email: row.email,
        name: row.name,
        createdAt: row.createdAt.toISOString(),
        plan: null,
      }));
    },

    async getUser(userId) {
      const [row] = await db
        .select({
          userId: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
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
        emailVerified: row.emailVerified,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    },

    async listExecutionsForOwner(input) {
      const limit = Math.min(Math.max(input.limit, 1), 50);
      const rows = await db
        .select({
          id: conversions.id,
          ownerId: conversions.ownerId,
          ownerKind: conversions.ownerKind,
          tool: conversions.conversionType,
          status: conversions.status,
          createdAt: conversions.createdAt,
          completedAt: conversions.completedAt,
          expiresAt: conversions.expiresAt,
        })
        .from(conversions)
        .where(eq(conversions.ownerId, input.ownerId))
        .orderBy(desc(conversions.createdAt))
        .limit(limit);

      return rows.map((row) => ({
        id: row.id,
        ownerId: row.ownerId,
        ownerKind: row.ownerKind,
        tool: row.tool,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
        completedAt: row.completedAt?.toISOString() ?? null,
        expiresAt: row.expiresAt?.toISOString() ?? null,
      }));
    },

    async listAnonymousSessions(input) {
      const limit = Math.min(Math.max(input.limit, 1), 100);
      const rows = await db
        .select({
          id: anonymousSessions.id,
          createdAt: anonymousSessions.createdAt,
          expiresAt: anonymousSessions.expiresAt,
          lastSeenAt: anonymousSessions.lastSeenAt,
        })
        .from(anonymousSessions)
        .orderBy(desc(anonymousSessions.lastSeenAt))
        .limit(limit);

      return rows.map((row) => ({
        id: row.id,
        createdAt: row.createdAt.toISOString(),
        expiresAt: row.expiresAt.toISOString(),
        lastSeenAt: row.lastSeenAt.toISOString(),
      }));
    },
  };
}

export function createMemoryAdminQueryService(options?: {
  actors?: readonly AdminActor[];
  overview?: AdminOverview;
  users?: readonly AdminUserSummary[];
  userRecords?: readonly AdminUserRecord[];
  executions?: readonly AdminExecutionRecord[];
  anonymousSessions?: readonly AdminAnonymousSessionRecord[];
}): AdminQueryService {
  const actors = options?.actors ?? [];
  const overview = options?.overview ?? {
    users: 0,
    anonymousSessions: 0,
    executions: { ...EMPTY_EXECUTION_COUNTS },
  };
  const users = options?.users ?? [];
  const userRecords = options?.userRecords ?? [];
  const executions = options?.executions ?? [];
  const anonymous = options?.anonymousSessions ?? [];

  return {
    async findActorByUserId(userId) {
      return actors.find((actor) => actor.userId === userId) ?? null;
    },
    async getOverview() {
      return overview;
    },
    async listUsers() {
      return [...users];
    },
    async getUser(userId) {
      return userRecords.find((record) => record.userId === userId) ?? null;
    },
    async listExecutionsForOwner(input) {
      return executions.filter((item) => item.ownerId === input.ownerId);
    },
    async listAnonymousSessions() {
      return [...anonymous];
    },
  };
}
