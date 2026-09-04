import {
  API_PACK_MONTHLY_PRICE_USD,
  WEB_PLAN_MONTHLY_PRICE_USD,
} from "@sohappypdf/billing";
import {
  anonymousSessions,
  apiSubscriptions,
  billingSubscriptions,
  conversions,
  conversionUsageEvents,
  files,
  getDb,
  user,
  webCreditLedgerEntries,
} from "@sohappypdf/db";
import { and, eq, gte, isNotNull, isNull, sql } from "drizzle-orm";
import { startOfUtcDay } from "@/server/query/date-range";
import {
  ACTIVE_SUBSCRIPTION_SQL,
  avgNumber,
  countInt,
} from "@/server/query/sql";

export type DashboardMetrics = {
  generatedAt: string;
  users: {
    total: number;
    newToday: number;
    activeToday: number;
    pro: number;
  };
  anonymous: {
    activeSessions: number;
    executionsToday: number;
  };
  processing: {
    executionsToday: number;
    processingNow: number;
    completedToday: number;
    failedToday: number;
    averageDurationMs: number | null;
  };
  storage: {
    temporaryFiles: number;
    usageBytes: number;
    expiringSoon: number;
    eligibleForCleanup: number;
  };
  revenue: {
    activeProSubscriptions: number;
    activeApiSubscriptions: number;
    estimatedMrrUsd: number;
    estimatedMrrSource: "derived";
    recentSubscriptionEvents: number;
  };
  api: {
    executionsToday: number;
    errorsToday: number;
    creditsConsumedToday: number;
  };
};

export async function getDashboardMetrics(
  now: Date = new Date(),
): Promise<DashboardMetrics> {
  const db = getDb();
  const today = startOfUtcDay(now);
  const expiringSoon = new Date(now.getTime() + 30 * 60 * 1000);

  const [
    [usersTotal],
    [usersNewToday],
    [usersActiveToday],
    [proUsers],
    [anonymousActive],
    [anonymousExecutionsToday],
    [executionsToday],
    [processingNow],
    [completedToday],
    [failedToday],
    [averageDuration],
    [temporaryFiles],
    [storageUsage],
    [expiringSoonFiles],
    [cleanupEligible],
    [activePro],
    [activeApi],
    [recentBillingEvents],
    [apiExecutionsToday],
    [apiErrorsToday],
    [apiCreditsToday],
    apiByProduct,
  ] = await Promise.all([
    db.select({ value: sql<number>`count(*)::int` }).from(user),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(user)
      .where(gte(user.createdAt, today)),
    db
      .select({
        value: sql<number>`count(distinct ${conversions.ownerId})::int`,
      })
      .from(conversions)
      .where(
        and(
          eq(conversions.ownerKind, "user"),
          gte(conversions.createdAt, today),
        ),
      ),
    db
      .select({
        value: sql<number>`count(distinct ${billingSubscriptions.userId})::int`,
      })
      .from(billingSubscriptions)
      .where(
        and(eq(billingSubscriptions.plan, "pro"), ACTIVE_SUBSCRIPTION_SQL),
      ),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(anonymousSessions)
      .where(gte(anonymousSessions.expiresAt, now)),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(conversions)
      .where(
        and(
          eq(conversions.ownerKind, "anonymous_session"),
          gte(conversions.createdAt, today),
        ),
      ),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(conversions)
      .where(gte(conversions.createdAt, today)),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(conversions)
      .where(eq(conversions.status, "processing")),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(conversions)
      .where(
        and(
          eq(conversions.status, "completed"),
          gte(conversions.createdAt, today),
        ),
      ),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(conversions)
      .where(
        and(
          eq(conversions.status, "failed"),
          gte(conversions.createdAt, today),
        ),
      ),
    db
      .select({
        value: sql<
          number | null
        >`avg(extract(epoch from (${conversions.completedAt} - ${conversions.startedAt})) * 1000)`,
      })
      .from(conversions)
      .where(
        and(
          isNotNull(conversions.startedAt),
          isNotNull(conversions.completedAt),
          gte(conversions.createdAt, today),
        ),
      ),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(files)
      .where(isNull(files.purgedAt)),
    db
      .select({
        value: sql<number>`coalesce(sum(${files.sizeBytes}), 0)::bigint`,
      })
      .from(files)
      .where(isNull(files.purgedAt)),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(files)
      .where(
        and(
          isNull(files.purgedAt),
          gte(files.expiresAt, now),
          sql`${files.expiresAt} <= ${expiringSoon}`,
        ),
      ),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(files)
      .where(and(isNull(files.purgedAt), sql`${files.expiresAt} <= ${now}`)),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(billingSubscriptions)
      .where(
        and(eq(billingSubscriptions.plan, "pro"), ACTIVE_SUBSCRIPTION_SQL),
      ),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(apiSubscriptions)
      .where(ACTIVE_SUBSCRIPTION_SQL),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(billingSubscriptions)
      .where(gte(billingSubscriptions.updatedAt, today)),
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
      .select({ value: sql<number>`count(*)::int` })
      .from(conversions)
      .innerJoin(
        conversionUsageEvents,
        eq(conversionUsageEvents.conversionId, conversions.id),
      )
      .where(
        and(
          isNotNull(conversionUsageEvents.apiKeyId),
          eq(conversions.status, "failed"),
          gte(conversions.createdAt, today),
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
    db
      .select({
        productKey: apiSubscriptions.productKey,
        value: sql<number>`count(*)::int`,
      })
      .from(apiSubscriptions)
      .where(ACTIVE_SUBSCRIPTION_SQL)
      .groupBy(apiSubscriptions.productKey),
  ]);

  const activeProSubscriptions = countInt(activePro?.value);
  const activeApiSubscriptions = countInt(activeApi?.value);
  const apiCreditsConsumedToday = countInt(apiCreditsToday?.value);
  const apiMrr = apiByProduct.reduce((total, row) => {
    const price = API_PACK_MONTHLY_PRICE_USD[row.productKey];
    return total + countInt(row.value) * price;
  }, 0);

  return {
    generatedAt: now.toISOString(),
    users: {
      total: countInt(usersTotal?.value),
      newToday: countInt(usersNewToday?.value),
      activeToday: countInt(usersActiveToday?.value),
      pro: countInt(proUsers?.value),
    },
    anonymous: {
      activeSessions: countInt(anonymousActive?.value),
      executionsToday: countInt(anonymousExecutionsToday?.value),
    },
    processing: {
      executionsToday: countInt(executionsToday?.value),
      processingNow: countInt(processingNow?.value),
      completedToday: countInt(completedToday?.value),
      failedToday: countInt(failedToday?.value),
      averageDurationMs: avgNumber(averageDuration?.value),
    },
    storage: {
      temporaryFiles: countInt(temporaryFiles?.value),
      usageBytes: countInt(storageUsage?.value),
      expiringSoon: countInt(expiringSoonFiles?.value),
      eligibleForCleanup: countInt(cleanupEligible?.value),
    },
    revenue: {
      activeProSubscriptions,
      activeApiSubscriptions,
      estimatedMrrUsd:
        activeProSubscriptions * WEB_PLAN_MONTHLY_PRICE_USD.pro + apiMrr,
      estimatedMrrSource: "derived",
      recentSubscriptionEvents: countInt(recentBillingEvents?.value),
    },
    api: {
      executionsToday: countInt(apiExecutionsToday?.value),
      errorsToday: countInt(apiErrorsToday?.value),
      creditsConsumedToday: apiCreditsConsumedToday,
    },
  };
}
