import {
  API_PACK_MONTHLY_PRICE_USD,
  monthlyUsdFromBilledAmount,
  WEB_PLAN_MONTHLY_PRICE_USD,
} from "@sohappypdf/billing";
import {
  apiSubscriptions,
  billingSubscriptions,
  getDb,
  user,
  webhookEvents,
} from "@sohappypdf/db";
import { desc, eq, sql } from "drizzle-orm";
import { startOfUtcDay } from "@/server/query/date-range";
import { ACTIVE_SUBSCRIPTION_SQL, countInt } from "@/server/query/sql";

export async function getEstimatedMrrUsd(db = getDb()) {
  const [webRows, apiRows] = await Promise.all([
    db
      .select({
        amountCents: billingSubscriptions.amountCents,
        recurringInterval: billingSubscriptions.recurringInterval,
      })
      .from(billingSubscriptions)
      .where(ACTIVE_SUBSCRIPTION_SQL),
    db
      .select({
        amountCents: apiSubscriptions.amountCents,
        recurringInterval: apiSubscriptions.recurringInterval,
      })
      .from(apiSubscriptions)
      .where(ACTIVE_SUBSCRIPTION_SQL),
  ]);

  return [...webRows, ...apiRows].reduce(
    (total, row) => total + monthlyUsdFromBilledAmount(row),
    0,
  );
}

export async function getAdminBillingOverview() {
  const db = getDb();
  const today = startOfUtcDay(new Date());

  const [
    [activePro],
    [canceledPro],
    [newProToday],
    apiByProduct,
    recentWebhooks,
    recentWebSubscriptions,
    recentApiSubscriptions,
    estimatedMrrUsd,
  ] = await Promise.all([
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(billingSubscriptions)
      .where(
        sql`${billingSubscriptions.plan} = 'pro' and ${ACTIVE_SUBSCRIPTION_SQL}`,
      ),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(billingSubscriptions)
      .where(eq(billingSubscriptions.status, "canceled")),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(billingSubscriptions)
      .where(sql`${billingSubscriptions.createdAt} >= ${today}`),
    db
      .select({
        productKey: apiSubscriptions.productKey,
        value: sql<number>`count(*)::int`,
      })
      .from(apiSubscriptions)
      .where(ACTIVE_SUBSCRIPTION_SQL)
      .groupBy(apiSubscriptions.productKey),
    db
      .select({
        id: webhookEvents.id,
        eventType: webhookEvents.eventType,
        processedAt: webhookEvents.processedAt,
      })
      .from(webhookEvents)
      .orderBy(desc(webhookEvents.processedAt))
      .limit(20),
    db
      .select({
        id: billingSubscriptions.id,
        userId: billingSubscriptions.userId,
        email: user.email,
        name: user.name,
        image: user.image,
        plan: billingSubscriptions.plan,
        status: billingSubscriptions.status,
        polarSubscriptionId: billingSubscriptions.polarSubscriptionId,
        currentPeriodEnd: billingSubscriptions.currentPeriodEnd,
        updatedAt: billingSubscriptions.updatedAt,
      })
      .from(billingSubscriptions)
      .leftJoin(user, eq(user.id, billingSubscriptions.userId))
      .orderBy(desc(billingSubscriptions.updatedAt))
      .limit(15),
    db
      .select({
        id: apiSubscriptions.id,
        userId: apiSubscriptions.userId,
        email: user.email,
        name: user.name,
        image: user.image,
        productKey: apiSubscriptions.productKey,
        status: apiSubscriptions.status,
        polarSubscriptionId: apiSubscriptions.polarSubscriptionId,
        currentPeriodEnd: apiSubscriptions.currentPeriodEnd,
        updatedAt: apiSubscriptions.updatedAt,
      })
      .from(apiSubscriptions)
      .leftJoin(user, eq(user.id, apiSubscriptions.userId))
      .orderBy(desc(apiSubscriptions.updatedAt))
      .limit(15),
    getEstimatedMrrUsd(db),
  ]);

  const apiCounts = {
    starter: 0,
    growth: 0,
    scale: 0,
  };

  for (const row of apiByProduct) {
    apiCounts[row.productKey] = countInt(row.value);
  }

  return {
    web: {
      activePro: countInt(activePro?.value),
      canceled: countInt(canceledPro?.value),
      newToday: countInt(newProToday?.value),
      listPriceUsd: WEB_PLAN_MONTHLY_PRICE_USD.pro,
    },
    api: {
      ...apiCounts,
      listPricesUsd: API_PACK_MONTHLY_PRICE_USD,
    },
    estimatedMrrUsd,
    estimatedMrrSource: "billed" as const,
    recentWebhooks,
    recentWebSubscriptions,
    recentApiSubscriptions,
  };
}
