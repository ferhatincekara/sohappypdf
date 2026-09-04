import {
  apiKeys,
  apiSubscriptions,
  conversionUsageEvents,
  getDb,
  usagePeriods,
  user,
  webCreditLedgerEntries,
} from "@sohappypdf/db";
import { and, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
import { startOfUtcDay } from "@/server/query/date-range";
import { paginated, parsePage, parsePageSize } from "@/server/query/pagination";
import { ACTIVE_SUBSCRIPTION_SQL, countInt } from "@/server/query/sql";

export async function getAdminApiOverview() {
  const db = getDb();
  const today = startOfUtcDay(new Date());

  const [
    [activeKeys],
    [apiUsers],
    [activeSubscriptions],
    [executionsToday],
    [creditsConsumedToday],
  ] = await Promise.all([
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(apiKeys)
      .where(sql`${apiKeys.revokedAt} is null`),
    db
      .select({
        value: sql<number>`count(distinct ${apiKeys.userId})::int`,
      })
      .from(apiKeys)
      .where(sql`${apiKeys.revokedAt} is null`),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(apiSubscriptions)
      .where(ACTIVE_SUBSCRIPTION_SQL),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(conversionUsageEvents)
      .where(
        and(
          isNotNull(conversionUsageEvents.apiKeyId),
          gte(conversionUsageEvents.createdAt, today),
        ),
      ),
    db
      .select({
        value: sql<number>`coalesce(sum(${webCreditLedgerEntries.amount}), 0)::int`,
      })
      .from(webCreditLedgerEntries)
      .where(
        and(
          eq(webCreditLedgerEntries.source, "api"),
          eq(webCreditLedgerEntries.type, "consume"),
          gte(webCreditLedgerEntries.createdAt, today),
        ),
      ),
  ]);

  return {
    activeKeys: countInt(activeKeys?.value),
    apiUsers: countInt(apiUsers?.value),
    activeSubscriptions: countInt(activeSubscriptions?.value),
    executionsToday: countInt(executionsToday?.value),
    creditsConsumedToday: countInt(creditsConsumedToday?.value),
  };
}

export async function listAdminApiKeys(filters: { page?: string; q?: string }) {
  const db = getDb();
  const page = parsePage(filters.page);
  const pageSize = parsePageSize(undefined);
  const query = filters.q?.trim();
  const where =
    query === undefined || query.length === 0
      ? undefined
      : sql`${apiKeys.userId} = ${query} or ${apiKeys.id}::text = ${query} or ${user.email} ilike ${`${query}%`}`;

  const [totalRow] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(apiKeys)
    .innerJoin(user, eq(user.id, apiKeys.userId))
    .where(where);

  const rows = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      userId: apiKeys.userId,
      email: user.email,
      createdAt: apiKeys.createdAt,
      lastUsedAt: apiKeys.lastUsedAt,
      expiresAt: apiKeys.expiresAt,
      revokedAt: apiKeys.revokedAt,
    })
    .from(apiKeys)
    .innerJoin(user, eq(user.id, apiKeys.userId))
    .where(where)
    .orderBy(desc(apiKeys.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return paginated(rows, countInt(totalRow?.value), page, pageSize);
}

export async function listAdminApiUsers() {
  const db = getDb();

  return db
    .select({
      userId: usagePeriods.userId,
      email: user.email,
      apiCreditsGranted: usagePeriods.apiCreditsGranted,
      apiCreditsUsed: usagePeriods.apiCreditsUsed,
      productKey: apiSubscriptions.productKey,
      status: apiSubscriptions.status,
    })
    .from(usagePeriods)
    .innerJoin(user, eq(user.id, usagePeriods.userId))
    .leftJoin(
      apiSubscriptions,
      and(
        eq(apiSubscriptions.userId, usagePeriods.userId),
        ACTIVE_SUBSCRIPTION_SQL,
      ),
    )
    .where(sql`${usagePeriods.apiCreditsGranted} > 0`)
    .orderBy(desc(usagePeriods.updatedAt))
    .limit(25);
}
