import { getUtcMonthPeriod } from "@repo/billing";
import {
  adminAuditEvents,
  anonymousSessions,
  billingSubscriptions,
  conversions,
  type Database,
  getDb,
  usagePeriods,
  user,
  webCreditLedgerEntries,
} from "@repo/db";
import {
  and,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  lt,
  or,
  sql,
} from "drizzle-orm";
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

export type AdminLedgerEntry = {
  id: string;
  userId: string;
  amount: number;
  type: string;
  source: string;
  reason: string;
  createdAt: string;
};

export const ADMIN_AUDIT_ACTIONS = {
  billingAdjustCredits: "billing.adjust_credits",
} as const;

export type AdminAuditEventRecord = {
  id: string;
  actorUserId: string;
  actorEmail: string | null;
  actorName: string | null;
  action: string;
  targetType: string;
  targetId: string;
  reason: string | null;
  createdAt: string;
};

export type RecordAdminAuditEventInput = {
  actorUserId: string;
  actorEmail?: string | null;
  actorName?: string | null;
  action: string;
  targetType: string;
  targetId: string;
  reason?: string | null;
};

export type AdminBillingInsights = {
  usersByPlan: {
    free: number;
    pro: number;
  };
  usage: {
    periodStart: string;
    periodEnd: string;
    webCreditsUsed: number;
    webCreditsGranted: number;
    apiCreditsUsed: number;
    apiCreditsGranted: number;
    aiCreditsUsed: number;
    aiCreditsGranted: number;
    conversionsUsed: number;
  };
  ledger: AdminLedgerEntry[];
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
  listExecutions(input: {
    limit: number;
    status?: string;
  }): Promise<AdminExecutionRecord[]>;
  getBillingInsights(now?: Date): Promise<AdminBillingInsights>;
  recordAuditEvent(input: RecordAdminAuditEventInput): Promise<void>;
  listAuditEvents(input: { limit: number }): Promise<AdminAuditEventRecord[]>;
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

    async listExecutions(input) {
      const limit = Math.min(Math.max(input.limit, 1), 100);
      const status = input.status;
      const now = new Date();
      const statusFilter =
        status === "expired"
          ? and(
              eq(conversions.status, "completed"),
              isNotNull(conversions.expiresAt),
              lt(conversions.expiresAt, now),
            )
          : status === "pending" ||
              status === "queued" ||
              status === "processing" ||
              status === "completed" ||
              status === "failed" ||
              status === "cancelled"
            ? eq(conversions.status, status)
            : undefined;
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
        .where(statusFilter)
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

    async getBillingInsights(now = new Date()) {
      const period = getUtcMonthPeriod(now);
      const [userCountRow] = await db.select({ value: count() }).from(user);
      const [proRow] = await db
        .select({
          value: sql<number>`cast(count(distinct ${billingSubscriptions.userId}) as int)`,
        })
        .from(billingSubscriptions)
        .where(
          and(
            eq(billingSubscriptions.plan, "pro"),
            inArray(billingSubscriptions.status, ["active", "trialing"]),
          ),
        );
      const [usageRow] = await db
        .select({
          webCreditsUsed: sql<number>`coalesce(sum(${usagePeriods.webCreditsUsed}), 0)`,
          webCreditsGranted: sql<number>`coalesce(sum(${usagePeriods.webCreditsGranted}), 0)`,
          apiCreditsUsed: sql<number>`coalesce(sum(${usagePeriods.apiCreditsUsed}), 0)`,
          apiCreditsGranted: sql<number>`coalesce(sum(${usagePeriods.apiCreditsGranted}), 0)`,
          aiCreditsUsed: sql<number>`coalesce(sum(${usagePeriods.aiCreditsUsed}), 0)`,
          aiCreditsGranted: sql<number>`coalesce(sum(${usagePeriods.aiCreditsGranted}), 0)`,
          conversionsUsed: sql<number>`coalesce(sum(${usagePeriods.conversionsUsed}), 0)`,
        })
        .from(usagePeriods)
        .where(eq(usagePeriods.periodStart, period.start));
      const ledgerRows = await db
        .select({
          id: webCreditLedgerEntries.id,
          userId: webCreditLedgerEntries.userId,
          amount: webCreditLedgerEntries.amount,
          type: webCreditLedgerEntries.type,
          source: webCreditLedgerEntries.source,
          reason: webCreditLedgerEntries.reason,
          createdAt: webCreditLedgerEntries.createdAt,
        })
        .from(webCreditLedgerEntries)
        .orderBy(desc(webCreditLedgerEntries.createdAt))
        .limit(50);

      const totalUsers = toCount(userCountRow?.value);
      const proUsers = toCount(proRow?.value);

      return {
        usersByPlan: {
          free: Math.max(0, totalUsers - proUsers),
          pro: proUsers,
        },
        usage: {
          periodStart: period.start.toISOString(),
          periodEnd: period.end.toISOString(),
          webCreditsUsed: toCount(usageRow?.webCreditsUsed),
          webCreditsGranted: toCount(usageRow?.webCreditsGranted),
          apiCreditsUsed: toCount(usageRow?.apiCreditsUsed),
          apiCreditsGranted: toCount(usageRow?.apiCreditsGranted),
          aiCreditsUsed: toCount(usageRow?.aiCreditsUsed),
          aiCreditsGranted: toCount(usageRow?.aiCreditsGranted),
          conversionsUsed: toCount(usageRow?.conversionsUsed),
        },
        ledger: ledgerRows.map((row) => ({
          id: row.id,
          userId: row.userId,
          amount: row.amount,
          type: row.type,
          source: row.source,
          reason: row.reason,
          createdAt: row.createdAt.toISOString(),
        })),
      };
    },

    async recordAuditEvent(input) {
      const action = input.action.trim();
      const targetType = input.targetType.trim();
      const targetId = input.targetId.trim();
      const reason = input.reason?.trim() ?? "";

      await db.insert(adminAuditEvents).values({
        actorUserId: input.actorUserId,
        action,
        targetType,
        targetId,
        reason: reason.length === 0 ? null : reason,
      });
    },

    async listAuditEvents(input) {
      const limit = Math.min(Math.max(input.limit, 1), 100);
      const rows = await db
        .select({
          id: adminAuditEvents.id,
          actorUserId: adminAuditEvents.actorUserId,
          actorEmail: user.email,
          actorName: user.name,
          action: adminAuditEvents.action,
          targetType: adminAuditEvents.targetType,
          targetId: adminAuditEvents.targetId,
          reason: adminAuditEvents.reason,
          createdAt: adminAuditEvents.createdAt,
        })
        .from(adminAuditEvents)
        .leftJoin(user, eq(adminAuditEvents.actorUserId, user.id))
        .orderBy(desc(adminAuditEvents.createdAt))
        .limit(limit);

      return rows.map((row) => ({
        id: row.id,
        actorUserId: row.actorUserId,
        actorEmail: row.actorEmail,
        actorName: row.actorName,
        action: row.action,
        targetType: row.targetType,
        targetId: row.targetId,
        reason: row.reason,
        createdAt: row.createdAt.toISOString(),
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
  billingInsights?: AdminBillingInsights;
  auditEvents?: AdminAuditEventRecord[];
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
  const billingInsights = options?.billingInsights;
  const auditEvents = options?.auditEvents ?? [];

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
    async listExecutions(input) {
      if (input.status === undefined || input.status.trim() === "") {
        return [...executions];
      }

      if (input.status === "expired") {
        const now = Date.now();
        return executions.filter(
          (item) =>
            item.status === "completed" &&
            item.expiresAt !== null &&
            Date.parse(item.expiresAt) < now,
        );
      }

      return executions.filter((item) => item.status === input.status);
    },
    async getBillingInsights(now = new Date()) {
      if (billingInsights !== undefined) {
        return billingInsights;
      }

      const period = getUtcMonthPeriod(now);
      return {
        usersByPlan: { free: users.length, pro: 0 },
        usage: {
          periodStart: period.start.toISOString(),
          periodEnd: period.end.toISOString(),
          webCreditsUsed: 0,
          webCreditsGranted: 0,
          apiCreditsUsed: 0,
          apiCreditsGranted: 0,
          aiCreditsUsed: 0,
          aiCreditsGranted: 0,
          conversionsUsed: 0,
        },
        ledger: [],
      };
    },
    async recordAuditEvent(input) {
      const actor =
        actors.find((item) => item.userId === input.actorUserId) ?? null;
      auditEvents.unshift({
        id: crypto.randomUUID(),
        actorUserId: input.actorUserId,
        actorEmail: input.actorEmail ?? actor?.email ?? null,
        actorName: input.actorName ?? actor?.name ?? null,
        action: input.action.trim(),
        targetType: input.targetType.trim(),
        targetId: input.targetId.trim(),
        reason: input.reason?.trim() ? input.reason.trim() : null,
        createdAt: new Date().toISOString(),
      });
    },
    async listAuditEvents(input) {
      return auditEvents.slice(0, Math.min(Math.max(input.limit, 1), 100));
    },
  };
}
