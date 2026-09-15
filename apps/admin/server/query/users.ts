import { getBillingService } from "@sohappypdf/billing";
import {
  DEFAULT_API_CREDIT_PACKS,
  FREE_OPERATIONS_PER_DAY,
  INCLUDED_API_CREDITS_PER_MONTH,
} from "@sohappypdf/billing/plans";
import {
  apiKeys,
  apiSubscriptions,
  billingSubscriptions,
  conversions,
  conversionUsageEvents,
  getDb,
  session,
  usagePeriods,
  user,
  webCreditLedgerEntries,
} from "@sohappypdf/db";
import { and, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { parseOptionalDate, startOfUtcDay } from "@/server/query/date-range";
import { paginated, parsePage, parsePageSize } from "@/server/query/pagination";
import {
  ACTIVE_SUBSCRIPTION_SQL,
  countInt,
  QUALIFIED_USER_ID_SQL,
} from "@/server/query/sql";

export type AdminUserListFilters = {
  q?: string;
  plan?: "free" | "pro";
  developer?: "none" | "starter" | "growth" | "scale";
  status?: "active" | "suspended";
  from?: string;
  to?: string;
  page?: string;
};

export type AdminUserListRow = {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: string;
  suspendedAt: Date | null;
  createdAt: Date;
  lastActivityAt: Date | null;
  webPlan: "free" | "pro";
  developerPlan: "none" | "starter" | "growth" | "scale";
  dailyOperationsUsed: number;
  dailyOperationsLimit: number | null;
  apiCreditsRemaining: number;
};

function entitledApiCredits(
  pack: "none" | "starter" | "growth" | "scale",
): number {
  if (pack === "none") {
    return INCLUDED_API_CREDITS_PER_MONTH;
  }

  return DEFAULT_API_CREDIT_PACKS[pack];
}

function remainingApiCredits(input: {
  pack: "none" | "starter" | "growth" | "scale";
  granted: number | null | undefined;
  used: number | null | undefined;
}): number {
  const entitled = entitledApiCredits(input.pack);
  const granted = Math.max(input.granted ?? 0, entitled);
  return Math.max(0, granted - (input.used ?? 0));
}

export async function listAdminUsers(filters: AdminUserListFilters) {
  const db = getDb();
  const page = parsePage(filters.page);
  const pageSize = parsePageSize(undefined);
  const from = parseOptionalDate(filters.from);
  const to = parseOptionalDate(filters.to);
  const conditions = [];

  if (filters.q !== undefined && filters.q.trim().length > 0) {
    const query = filters.q.trim();
    conditions.push(
      or(
        eq(user.id, query),
        eq(user.email, query.toLowerCase()),
        ilike(user.email, `${query}%`),
        ilike(user.name, `${query}%`),
      ),
    );
  }

  if (filters.status === "suspended") {
    conditions.push(sql`${user.suspendedAt} is not null`);
  } else if (filters.status === "active") {
    conditions.push(sql`${user.suspendedAt} is null`);
  }

  if (from !== undefined) {
    conditions.push(gte(user.createdAt, from));
  }

  if (to !== undefined) {
    conditions.push(lte(user.createdAt, to));
  }

  if (filters.plan === "pro") {
    conditions.push(sql`exists (
      select 1 from ${billingSubscriptions}
      where ${billingSubscriptions.userId} = ${QUALIFIED_USER_ID_SQL}
        and ${billingSubscriptions.plan} = 'pro'
        and ${ACTIVE_SUBSCRIPTION_SQL}
    )`);
  } else if (filters.plan === "free") {
    conditions.push(sql`not exists (
      select 1 from ${billingSubscriptions}
      where ${billingSubscriptions.userId} = ${QUALIFIED_USER_ID_SQL}
        and ${billingSubscriptions.plan} = 'pro'
        and ${ACTIVE_SUBSCRIPTION_SQL}
    )`);
  }

  if (filters.developer !== undefined && filters.developer !== "none") {
    conditions.push(sql`exists (
      select 1 from ${apiSubscriptions}
      where ${apiSubscriptions.userId} = ${QUALIFIED_USER_ID_SQL}
        and ${apiSubscriptions.productKey} = ${filters.developer}
        and ${ACTIVE_SUBSCRIPTION_SQL}
    )`);
  } else if (filters.developer === "none") {
    conditions.push(sql`not exists (
      select 1 from ${apiSubscriptions}
      where ${apiSubscriptions.userId} = ${QUALIFIED_USER_ID_SQL}
        and ${ACTIVE_SUBSCRIPTION_SQL}
    )`);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const offset = (page - 1) * pageSize;

  const [totalRow] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(user)
    .where(where);

  const users = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
      suspendedAt: user.suspendedAt,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(where)
    .orderBy(desc(user.createdAt), desc(user.id))
    .limit(pageSize)
    .offset(offset);

  if (users.length === 0) {
    return paginated([], countInt(totalRow?.value), page, pageSize);
  }

  const userIds = users.map((row) => row.id);
  const today = startOfUtcDay(new Date());
  const [
    proRows,
    developerRows,
    creditRows,
    sessionActivity,
    usageActivity,
    keyActivity,
    dailyUsageRows,
  ] = await Promise.all([
    db
      .select({ userId: billingSubscriptions.userId })
      .from(billingSubscriptions)
      .where(
        and(
          inArray(billingSubscriptions.userId, userIds),
          eq(billingSubscriptions.plan, "pro"),
          ACTIVE_SUBSCRIPTION_SQL,
        ),
      ),
    db
      .select({
        userId: apiSubscriptions.userId,
        productKey: apiSubscriptions.productKey,
        updatedAt: apiSubscriptions.updatedAt,
      })
      .from(apiSubscriptions)
      .where(
        and(inArray(apiSubscriptions.userId, userIds), ACTIVE_SUBSCRIPTION_SQL),
      ),
    db
      .select({
        userId: usagePeriods.userId,
        periodStart: usagePeriods.periodStart,
        webCreditsGranted: usagePeriods.webCreditsGranted,
        webCreditsUsed: usagePeriods.webCreditsUsed,
        apiCreditsGranted: usagePeriods.apiCreditsGranted,
        apiCreditsUsed: usagePeriods.apiCreditsUsed,
      })
      .from(usagePeriods)
      .where(inArray(usagePeriods.userId, userIds)),
    db
      .select({
        userId: session.userId,
        at: sql<Date | null>`max(${session.updatedAt})`,
      })
      .from(session)
      .where(inArray(session.userId, userIds))
      .groupBy(session.userId),
    db
      .select({
        userId: conversionUsageEvents.userId,
        at: sql<Date | null>`max(${conversionUsageEvents.createdAt})`,
      })
      .from(conversionUsageEvents)
      .where(inArray(conversionUsageEvents.userId, userIds))
      .groupBy(conversionUsageEvents.userId),
    db
      .select({
        userId: apiKeys.userId,
        at: sql<Date | null>`max(${apiKeys.lastUsedAt})`,
      })
      .from(apiKeys)
      .where(inArray(apiKeys.userId, userIds))
      .groupBy(apiKeys.userId),
    db
      .select({
        userId: conversionUsageEvents.userId,
        value: sql<number>`count(*)::int`,
      })
      .from(conversionUsageEvents)
      .where(
        and(
          inArray(conversionUsageEvents.userId, userIds),
          gte(conversionUsageEvents.createdAt, today),
        ),
      )
      .groupBy(conversionUsageEvents.userId),
  ]);

  const proUserIds = new Set(proRows.map((row) => row.userId));
  const developerByUser = new Map<
    string,
    { productKey: "starter" | "growth" | "scale"; updatedAt: Date }
  >();

  for (const row of developerRows) {
    const current = developerByUser.get(row.userId);
    if (current === undefined || row.updatedAt > current.updatedAt) {
      developerByUser.set(row.userId, {
        productKey: row.productKey,
        updatedAt: row.updatedAt,
      });
    }
  }

  const creditsByUser = new Map<
    string,
    {
      periodStart: Date;
      apiCreditsGranted: number;
      apiCreditsUsed: number;
    }
  >();

  for (const row of creditRows) {
    const current = creditsByUser.get(row.userId);
    if (current === undefined || row.periodStart > current.periodStart) {
      creditsByUser.set(row.userId, {
        periodStart: row.periodStart,
        apiCreditsGranted: row.apiCreditsGranted,
        apiCreditsUsed: row.apiCreditsUsed,
      });
    }
  }

  const dailyUsedByUser = new Map<string, number>();

  for (const row of dailyUsageRows) {
    dailyUsedByUser.set(row.userId, countInt(row.value));
  }

  const lastActivityByUser = new Map<string, Date>();

  for (const row of [...sessionActivity, ...usageActivity, ...keyActivity]) {
    const at = toDate(row.at);
    if (at === null) {
      continue;
    }

    const current = lastActivityByUser.get(row.userId);
    if (current === undefined || at > current) {
      lastActivityByUser.set(row.userId, at);
    }
  }

  const rows: AdminUserListRow[] = users.map((row) => {
    const credits = creditsByUser.get(row.id);
    const webPlan = proUserIds.has(row.id) ? "pro" : "free";
    const developerPlan = developerByUser.get(row.id)?.productKey ?? "none";

    return {
      ...row,
      lastActivityAt: lastActivityByUser.get(row.id) ?? null,
      webPlan,
      developerPlan,
      dailyOperationsUsed: dailyUsedByUser.get(row.id) ?? 0,
      dailyOperationsLimit: webPlan === "pro" ? null : FREE_OPERATIONS_PER_DAY,
      apiCreditsRemaining: remainingApiCredits({
        pack: developerPlan,
        granted: credits?.apiCreditsGranted,
        used: credits?.apiCreditsUsed,
      }),
    };
  });

  return paginated(rows, countInt(totalRow?.value), page, pageSize);
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function getAdminUserDetail(userId: string) {
  const db = getDb();
  const [row] = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
      emailVerified: user.emailVerified,
      suspendedAt: user.suspendedAt,
      suspendedReason: user.suspendedReason,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (row === undefined) {
    return null;
  }

  const billing = getBillingService();
  const [
    entitlements,
    webSubscription,
    apiSubscription,
    apiBalance,
    keys,
    recentExecutions,
    recentLedger,
    recentSessions,
    dailyUsedRow,
  ] = await Promise.all([
    billing.getEntitlements(userId),
    db
      .select({
        plan: billingSubscriptions.plan,
        status: billingSubscriptions.status,
        polarSubscriptionId: billingSubscriptions.polarSubscriptionId,
        currentPeriodEnd: billingSubscriptions.currentPeriodEnd,
        cancelAtPeriodEnd: billingSubscriptions.cancelAtPeriodEnd,
      })
      .from(billingSubscriptions)
      .where(eq(billingSubscriptions.userId, userId))
      .orderBy(desc(billingSubscriptions.updatedAt))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    db
      .select({
        productKey: apiSubscriptions.productKey,
        status: apiSubscriptions.status,
        polarSubscriptionId: apiSubscriptions.polarSubscriptionId,
        currentPeriodEnd: apiSubscriptions.currentPeriodEnd,
      })
      .from(apiSubscriptions)
      .where(eq(apiSubscriptions.userId, userId))
      .orderBy(desc(apiSubscriptions.updatedAt))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    billing.getApiCreditBalance(userId),
    db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        createdAt: apiKeys.createdAt,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        revokedAt: apiKeys.revokedAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId))
      .orderBy(desc(apiKeys.createdAt))
      .limit(20),
    db
      .select({
        id: conversions.id,
        status: conversions.status,
        conversionType: conversions.conversionType,
        createdAt: conversions.createdAt,
        completedAt: conversions.completedAt,
      })
      .from(conversions)
      .where(
        and(eq(conversions.ownerId, userId), eq(conversions.ownerKind, "user")),
      )
      .orderBy(desc(conversions.createdAt))
      .limit(10),
    db
      .select({
        id: webCreditLedgerEntries.id,
        amount: webCreditLedgerEntries.amount,
        type: webCreditLedgerEntries.type,
        source: webCreditLedgerEntries.source,
        reason: webCreditLedgerEntries.reason,
        createdAt: webCreditLedgerEntries.createdAt,
      })
      .from(webCreditLedgerEntries)
      .where(
        and(
          eq(webCreditLedgerEntries.userId, userId),
          sql`${webCreditLedgerEntries.source} <> 'ai'`,
        ),
      )
      .orderBy(desc(webCreditLedgerEntries.createdAt))
      .limit(20),
    db
      .select({
        id: session.id,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        expiresAt: session.expiresAt,
      })
      .from(session)
      .where(eq(session.userId, userId))
      .orderBy(desc(session.updatedAt))
      .limit(5),
    db
      .select({
        value: sql<number>`count(*)::int`,
      })
      .from(conversionUsageEvents)
      .where(
        and(
          eq(conversionUsageEvents.userId, userId),
          gte(conversionUsageEvents.createdAt, startOfUtcDay(new Date())),
        ),
      )
      .then((rows) => rows[0] ?? { value: 0 }),
  ]);

  return {
    user: row,
    entitlements,
    webSubscription,
    apiSubscription,
    credits: {
      web: {
        unlimited: entitlements.plan === "pro",
        dailyUsed: countInt(dailyUsedRow.value),
        dailyLimit: entitlements.limits.operationsPerDay,
      },
      api: {
        apiCreditsGranted: Math.max(
          apiBalance.apiCreditsGranted,
          entitledApiCredits(
            apiSubscription !== null &&
              (apiSubscription.status === "active" ||
                apiSubscription.status === "trialing" ||
                apiSubscription.status === "past_due")
              ? apiSubscription.productKey
              : "none",
          ),
        ),
        apiCreditsUsed: apiBalance.apiCreditsUsed,
        apiCreditsRemaining: remainingApiCredits({
          pack:
            apiSubscription !== null &&
            (apiSubscription.status === "active" ||
              apiSubscription.status === "trialing" ||
              apiSubscription.status === "past_due")
              ? apiSubscription.productKey
              : "none",
          granted: apiBalance.apiCreditsGranted,
          used: apiBalance.apiCreditsUsed,
        }),
      },
    },
    apiKeys: keys,
    recentExecutions,
    recentLedger,
    recentSessions,
  };
}
