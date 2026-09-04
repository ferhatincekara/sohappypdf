import { getBillingService } from "@sohappypdf/billing";
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
import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { parseOptionalDate } from "@/server/query/date-range";
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
  role: string;
  suspendedAt: Date | null;
  createdAt: Date;
  lastActivityAt: Date | null;
  webPlan: "free" | "pro";
  developerPlan: "none" | "starter" | "growth" | "scale";
  webCreditsRemaining: number | null;
  apiCreditsRemaining: number | null;
};

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

  const rows = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      suspendedAt: user.suspendedAt,
      createdAt: user.createdAt,
      lastActivityAt: sql<Date | null>`(
        select max(activity_at) from (
          select max(${session.updatedAt}) as activity_at
          from ${session}
          where ${session.userId} = ${QUALIFIED_USER_ID_SQL}
          union all
          select max(${conversionUsageEvents.createdAt})
          from ${conversionUsageEvents}
          where ${conversionUsageEvents.userId} = ${QUALIFIED_USER_ID_SQL}
          union all
          select max(${apiKeys.lastUsedAt})
          from ${apiKeys}
          where ${apiKeys.userId} = ${QUALIFIED_USER_ID_SQL}
        ) activity
      )`,
      webPlan: sql<"free" | "pro">`case when exists (
        select 1 from ${billingSubscriptions}
        where ${billingSubscriptions.userId} = ${QUALIFIED_USER_ID_SQL}
          and ${billingSubscriptions.plan} = 'pro'
          and ${ACTIVE_SUBSCRIPTION_SQL}
      ) then 'pro' else 'free' end`,
      developerPlan: sql<"none" | "starter" | "growth" | "scale">`coalesce((
        select ${apiSubscriptions.productKey}
        from ${apiSubscriptions}
        where ${apiSubscriptions.userId} = ${QUALIFIED_USER_ID_SQL}
          and ${ACTIVE_SUBSCRIPTION_SQL}
        order by ${apiSubscriptions.updatedAt} desc
        limit 1
      ), 'none')`,
      webCreditsRemaining: sql<number | null>`(
        select ${usagePeriods.webCreditsGranted} - ${usagePeriods.webCreditsUsed}
        from ${usagePeriods}
        where ${usagePeriods.userId} = ${QUALIFIED_USER_ID_SQL}
        order by ${usagePeriods.periodStart} desc
        limit 1
      )`,
      apiCreditsRemaining: sql<number | null>`(
        select ${usagePeriods.apiCreditsGranted} - ${usagePeriods.apiCreditsUsed}
        from ${usagePeriods}
        where ${usagePeriods.userId} = ${QUALIFIED_USER_ID_SQL}
        order by ${usagePeriods.periodStart} desc
        limit 1
      )`,
    })
    .from(user)
    .where(where)
    .orderBy(desc(user.createdAt), desc(user.id))
    .limit(pageSize)
    .offset(offset);

  return paginated(rows, countInt(totalRow?.value), page, pageSize);
}

export async function getAdminUserDetail(userId: string) {
  const db = getDb();
  const [row] = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
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
    usagePeriod,
    keys,
    recentExecutions,
    recentLedger,
    recentSessions,
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
    db
      .select({
        webCreditsGranted: usagePeriods.webCreditsGranted,
        webCreditsUsed: usagePeriods.webCreditsUsed,
        apiCreditsGranted: usagePeriods.apiCreditsGranted,
        apiCreditsUsed: usagePeriods.apiCreditsUsed,
        aiCreditsGranted: usagePeriods.aiCreditsGranted,
        aiCreditsUsed: usagePeriods.aiCreditsUsed,
      })
      .from(usagePeriods)
      .where(eq(usagePeriods.userId, userId))
      .orderBy(desc(usagePeriods.periodStart))
      .limit(1)
      .then((rows) => rows[0] ?? null),
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
      .where(eq(webCreditLedgerEntries.userId, userId))
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
  ]);

  return {
    user: row,
    entitlements,
    webSubscription,
    apiSubscription,
    credits: {
      web: {
        webCreditsGranted: usagePeriod?.webCreditsGranted ?? 0,
        webCreditsUsed: usagePeriod?.webCreditsUsed ?? 0,
        webCreditsRemaining:
          (usagePeriod?.webCreditsGranted ?? 0) -
          (usagePeriod?.webCreditsUsed ?? 0),
      },
      api: {
        apiCreditsGranted: usagePeriod?.apiCreditsGranted ?? 0,
        apiCreditsUsed: usagePeriod?.apiCreditsUsed ?? 0,
        apiCreditsRemaining:
          (usagePeriod?.apiCreditsGranted ?? 0) -
          (usagePeriod?.apiCreditsUsed ?? 0),
      },
      ai: {
        aiCreditsGranted: usagePeriod?.aiCreditsGranted ?? 0,
        aiCreditsUsed: usagePeriod?.aiCreditsUsed ?? 0,
        aiCreditsRemaining:
          (usagePeriod?.aiCreditsGranted ?? 0) -
          (usagePeriod?.aiCreditsUsed ?? 0),
      },
    },
    apiKeys: keys,
    recentExecutions,
    recentLedger,
    recentSessions,
  };
}
