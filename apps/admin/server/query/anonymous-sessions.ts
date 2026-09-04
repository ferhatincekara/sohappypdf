import { loadAnonymousConfig } from "@sohappypdf/config";
import { anonymousSessions, conversions, files, getDb } from "@sohappypdf/db";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { startOfUtcDay } from "@/server/query/date-range";
import { paginated, parsePage, parsePageSize } from "@/server/query/pagination";
import { countInt } from "@/server/query/sql";

export async function listAdminAnonymousSessions(filters: { page?: string }) {
  const db = getDb();
  const page = parsePage(filters.page);
  const pageSize = parsePageSize(undefined);
  const [totalRow] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(anonymousSessions);

  const rows = await db
    .select({
      id: anonymousSessions.id,
      createdAt: anonymousSessions.createdAt,
      lastSeenAt: anonymousSessions.lastSeenAt,
      expiresAt: anonymousSessions.expiresAt,
      executionCount: sql<number>`(
        select count(*)::int from ${conversions}
        where ${conversions.ownerKind} = 'anonymous_session'
          and ${conversions.ownerId} = ${anonymousSessions.id}::text
      )`,
      activeFiles: sql<number>`(
        select count(*)::int from ${files}
        where ${files.ownerKind} = 'anonymous_session'
          and ${files.ownerId} = ${anonymousSessions.id}::text
          and ${files.purgedAt} is null
      )`,
    })
    .from(anonymousSessions)
    .orderBy(desc(anonymousSessions.lastSeenAt), desc(anonymousSessions.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return paginated(rows, countInt(totalRow?.value), page, pageSize);
}

export async function getAdminAnonymousSession(id: string) {
  const db = getDb();
  const [row] = await db
    .select({
      id: anonymousSessions.id,
      createdAt: anonymousSessions.createdAt,
      lastSeenAt: anonymousSessions.lastSeenAt,
      expiresAt: anonymousSessions.expiresAt,
    })
    .from(anonymousSessions)
    .where(eq(anonymousSessions.id, id))
    .limit(1);

  if (row === undefined) {
    return null;
  }

  const today = startOfUtcDay(new Date());
  const [executionCount] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(conversions)
    .where(
      and(
        eq(conversions.ownerKind, "anonymous_session"),
        eq(conversions.ownerId, id),
      ),
    );
  const [executionsToday] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(conversions)
    .where(
      and(
        eq(conversions.ownerKind, "anonymous_session"),
        eq(conversions.ownerId, id),
        gte(conversions.createdAt, today),
      ),
    );
  const recentExecutions = await db
    .select({
      id: conversions.id,
      conversionType: conversions.conversionType,
      status: conversions.status,
      createdAt: conversions.createdAt,
    })
    .from(conversions)
    .where(
      and(
        eq(conversions.ownerKind, "anonymous_session"),
        eq(conversions.ownerId, id),
      ),
    )
    .orderBy(desc(conversions.createdAt))
    .limit(10);
  const [activeFiles] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(files)
    .where(
      and(
        eq(files.ownerKind, "anonymous_session"),
        eq(files.ownerId, id),
        sql`${files.purgedAt} is null`,
      ),
    );

  const dailyLimit = loadAnonymousConfig().operationsPerDay;

  return {
    session: row,
    executionCount: countInt(executionCount?.value),
    executionsToday: countInt(executionsToday?.value),
    dailyLimit,
    rateLimitStatus:
      countInt(executionsToday?.value) >= dailyLimit ? "limited" : "ok",
    activeFiles: countInt(activeFiles?.value),
    recentExecutions,
  };
}
