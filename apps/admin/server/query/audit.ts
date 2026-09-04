import { adminAuditEvents, getDb, user } from "@sohappypdf/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { paginated, parsePage, parsePageSize } from "@/server/query/pagination";
import { countInt } from "@/server/query/sql";

export async function listAdminAuditEvents(filters: {
  page?: string;
  action?: string;
  actor?: string;
}) {
  const db = getDb();
  const page = parsePage(filters.page);
  const pageSize = parsePageSize(undefined);
  const conditions = [];

  if (filters.action !== undefined && filters.action.length > 0) {
    conditions.push(eq(adminAuditEvents.action, filters.action));
  }

  if (filters.actor !== undefined && filters.actor.length > 0) {
    conditions.push(eq(adminAuditEvents.actorUserId, filters.actor));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [totalRow] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(adminAuditEvents)
    .where(where);

  const rows = await db
    .select({
      id: adminAuditEvents.id,
      actorUserId: adminAuditEvents.actorUserId,
      actorEmail: user.email,
      action: adminAuditEvents.action,
      targetType: adminAuditEvents.targetType,
      targetId: adminAuditEvents.targetId,
      reason: adminAuditEvents.reason,
      result: adminAuditEvents.result,
      metadata: adminAuditEvents.metadata,
      createdAt: adminAuditEvents.createdAt,
    })
    .from(adminAuditEvents)
    .innerJoin(user, eq(user.id, adminAuditEvents.actorUserId))
    .where(where)
    .orderBy(desc(adminAuditEvents.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return paginated(rows, countInt(totalRow?.value), page, pageSize);
}
