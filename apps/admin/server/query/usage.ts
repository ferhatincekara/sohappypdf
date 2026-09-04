import { conversions, conversionUsageEvents, getDb } from "@sohappypdf/db";
import { and, gte, sql } from "drizzle-orm";
import {
  type AdminDateRangePreset,
  fillDailySeries,
  resolveDateRange,
} from "@/server/query/date-range";
import { avgNumber, countInt } from "@/server/query/sql";

export async function getAdminUsageAnalytics(preset?: string) {
  const range = resolveDateRange(preset);
  const db = getDb();

  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      completed: sql<number>`count(*) filter (where ${conversions.status} = 'completed')::int`,
      failed: sql<number>`count(*) filter (where ${conversions.status} = 'failed')::int`,
      anonymous: sql<number>`count(*) filter (where ${conversions.ownerKind} = 'anonymous_session')::int`,
      authenticated: sql<number>`count(*) filter (where ${conversions.ownerKind} = 'user')::int`,
      averageDurationMs: sql<number | null>`avg(
        extract(epoch from (${conversions.completedAt} - ${conversions.startedAt})) * 1000
      )`,
    })
    .from(conversions)
    .where(gte(conversions.createdAt, range.start));

  const [apiCount] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(conversionUsageEvents)
    .where(
      and(
        gte(conversionUsageEvents.createdAt, range.start),
        sql`${conversionUsageEvents.apiKeyId} is not null`,
      ),
    );

  const byDay = await db
    .select({
      day: sql<string>`to_char((${conversions.createdAt} at time zone 'utc')::date, 'YYYY-MM-DD')`,
      total: sql<number>`count(*)::int`,
      failed: sql<number>`count(*) filter (where ${conversions.status} = 'failed')::int`,
    })
    .from(conversions)
    .where(gte(conversions.createdAt, range.start))
    .groupBy(sql`(${conversions.createdAt} at time zone 'utc')::date`)
    .orderBy(sql`(${conversions.createdAt} at time zone 'utc')::date`);

  const byTool = await db
    .select({
      tool: conversions.conversionType,
      total: sql<number>`count(*)::int`,
      failed: sql<number>`count(*) filter (where ${conversions.status} = 'failed')::int`,
    })
    .from(conversions)
    .where(gte(conversions.createdAt, range.start))
    .groupBy(conversions.conversionType)
    .orderBy(sql`count(*) desc`)
    .limit(12);

  const total = countInt(totals?.total);
  const completed = countInt(totals?.completed);
  const failed = countInt(totals?.failed);

  return {
    range,
    totals: {
      total,
      completed,
      failed,
      anonymous: countInt(totals?.anonymous),
      authenticated: countInt(totals?.authenticated),
      api: countInt(apiCount?.value),
      web: Math.max(
        countInt(totals?.authenticated) - countInt(apiCount?.value),
        0,
      ),
      successRate: total === 0 ? null : (completed / total) * 100,
      failureRate: total === 0 ? null : (failed / total) * 100,
      averageDurationMs: avgNumber(totals?.averageDurationMs),
    },
    byDay: fillDailySeries(
      range.start,
      range.end,
      byDay.map((row) => ({
        day: row.day,
        total: countInt(row.total),
        failed: countInt(row.failed),
      })),
      (day) => ({ day, total: 0, failed: 0 }),
    ),
    byTool: byTool.map((row) => ({
      tool: row.tool,
      total: countInt(row.total),
      failed: countInt(row.failed),
    })),
    presets: [
      "today",
      "7d",
      "30d",
      "90d",
    ] as const satisfies readonly AdminDateRangePreset[],
  };
}
