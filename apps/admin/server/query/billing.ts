import {
  API_PACK_MONTHLY_PRICE_USD,
  WEB_PLAN_MONTHLY_PRICE_USD,
} from "@sohappypdf/billing";
import {
  apiSubscriptions,
  billingSubscriptions,
  getDb,
  webhookEvents,
} from "@sohappypdf/db";
import { desc, eq, sql } from "drizzle-orm";
import { startOfUtcDay } from "@/server/query/date-range";
import { ACTIVE_SUBSCRIPTION_SQL, countInt } from "@/server/query/sql";

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
        plan: billingSubscriptions.plan,
        status: billingSubscriptions.status,
        polarSubscriptionId: billingSubscriptions.polarSubscriptionId,
        currentPeriodEnd: billingSubscriptions.currentPeriodEnd,
        updatedAt: billingSubscriptions.updatedAt,
      })
      .from(billingSubscriptions)
      .orderBy(desc(billingSubscriptions.updatedAt))
      .limit(15),
    db
      .select({
        id: apiSubscriptions.id,
        userId: apiSubscriptions.userId,
        productKey: apiSubscriptions.productKey,
        status: apiSubscriptions.status,
        polarSubscriptionId: apiSubscriptions.polarSubscriptionId,
        currentPeriodEnd: apiSubscriptions.currentPeriodEnd,
        updatedAt: apiSubscriptions.updatedAt,
      })
      .from(apiSubscriptions)
      .orderBy(desc(apiSubscriptions.updatedAt))
      .limit(15),
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
    estimatedMrrUsd:
      countInt(activePro?.value) * WEB_PLAN_MONTHLY_PRICE_USD.pro +
      apiCounts.starter * API_PACK_MONTHLY_PRICE_USD.starter +
      apiCounts.growth * API_PACK_MONTHLY_PRICE_USD.growth +
      apiCounts.scale * API_PACK_MONTHLY_PRICE_USD.scale,
    estimatedMrrSource: "derived" as const,
    recentWebhooks,
    recentWebSubscriptions,
    recentApiSubscriptions,
  };
}
