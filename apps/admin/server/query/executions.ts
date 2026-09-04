import { CONVERSION_STATUSES } from "@sohappypdf/conversions";
import {
  conversions,
  conversionUsageEvents,
  files,
  getDb,
  user,
} from "@sohappypdf/db";
import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { parseOptionalDate } from "@/server/query/date-range";
import { paginated, parsePage, parsePageSize } from "@/server/query/pagination";
import { avgNumber, countInt } from "@/server/query/sql";

export type AdminExecutionFilters = {
  q?: string;
  status?: string;
  tool?: string;
  ownerKind?: "user" | "anonymous_session";
  channel?: "web" | "api" | "anonymous";
  error?: "failed";
  from?: string;
  to?: string;
  page?: string;
};

export function isConversionStatusFilter(
  value: string | undefined,
): value is (typeof CONVERSION_STATUSES)[number] {
  return (
    value !== undefined &&
    (CONVERSION_STATUSES as readonly string[]).includes(value)
  );
}

export async function listAdminExecutions(filters: AdminExecutionFilters) {
  const db = getDb();
  const page = parsePage(filters.page);
  const pageSize = parsePageSize(undefined);
  const from = parseOptionalDate(filters.from);
  const to = parseOptionalDate(filters.to);
  const conditions = [];

  if (isConversionStatusFilter(filters.status)) {
    conditions.push(eq(conversions.status, filters.status));
  }

  if (filters.tool !== undefined && filters.tool.length > 0) {
    conditions.push(eq(conversions.conversionType, filters.tool));
  }

  if (filters.ownerKind !== undefined) {
    conditions.push(eq(conversions.ownerKind, filters.ownerKind));
  }

  if (filters.channel === "anonymous") {
    conditions.push(eq(conversions.ownerKind, "anonymous_session"));
  } else if (filters.channel === "api") {
    conditions.push(
      sql`exists (
        select 1 from ${conversionUsageEvents}
        where ${conversionUsageEvents.conversionId} = ${conversions.id}
          and ${conversionUsageEvents.apiKeyId} is not null
      )`,
    );
  } else if (filters.channel === "web") {
    conditions.push(eq(conversions.ownerKind, "user"));
    conditions.push(
      sql`not exists (
        select 1 from ${conversionUsageEvents}
        where ${conversionUsageEvents.conversionId} = ${conversions.id}
          and ${conversionUsageEvents.apiKeyId} is not null
      )`,
    );
  }

  if (filters.error === "failed") {
    conditions.push(eq(conversions.status, "failed"));
  }

  if (from !== undefined) {
    conditions.push(gte(conversions.createdAt, from));
  }

  if (to !== undefined) {
    conditions.push(lte(conversions.createdAt, to));
  }

  if (filters.q !== undefined && filters.q.trim().length > 0) {
    const query = filters.q.trim();
    conditions.push(
      or(
        eq(conversions.id, query),
        eq(conversions.ownerId, query),
        ilike(files.originalFilename, `${query}%`),
      ),
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [totalRow] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(conversions)
    .leftJoin(files, eq(files.id, conversions.sourceFileId))
    .where(where);

  const rows = await db
    .select({
      id: conversions.id,
      conversionType: conversions.conversionType,
      ownerId: conversions.ownerId,
      ownerKind: conversions.ownerKind,
      status: conversions.status,
      createdAt: conversions.createdAt,
      queuedAt: conversions.queuedAt,
      startedAt: conversions.startedAt,
      completedAt: conversions.completedAt,
      errorCode: conversions.errorCode,
      sourceFilename: files.originalFilename,
      durationMs: sql<number | null>`case
        when ${conversions.startedAt} is not null and ${conversions.completedAt} is not null
        then extract(epoch from (${conversions.completedAt} - ${conversions.startedAt})) * 1000
        else null
      end`,
      channel: sql<"web" | "api" | "anonymous">`case
        when ${conversions.ownerKind} = 'anonymous_session' then 'anonymous'
        when exists (
          select 1 from ${conversionUsageEvents}
          where ${conversionUsageEvents.conversionId} = ${conversions.id}
            and ${conversionUsageEvents.apiKeyId} is not null
        ) then 'api'
        else 'web'
      end`,
    })
    .from(conversions)
    .leftJoin(files, eq(files.id, conversions.sourceFileId))
    .where(where)
    .orderBy(desc(conversions.createdAt), desc(conversions.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return paginated(rows, countInt(totalRow?.value), page, pageSize);
}

export async function getAdminExecutionDetail(id: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(conversions)
    .where(eq(conversions.id, id))
    .limit(1);

  if (row === undefined) {
    return null;
  }

  const [sourceFile] = await db
    .select({
      id: files.id,
      originalFilename: files.originalFilename,
      mimeType: files.mimeType,
      sizeBytes: files.sizeBytes,
      status: files.status,
      createdAt: files.createdAt,
      expiresAt: files.expiresAt,
    })
    .from(files)
    .where(eq(files.id, row.sourceFileId))
    .limit(1);

  const outputFile =
    row.outputFileId === null
      ? null
      : ((
          await db
            .select({
              id: files.id,
              originalFilename: files.originalFilename,
              mimeType: files.mimeType,
              sizeBytes: files.sizeBytes,
              status: files.status,
              createdAt: files.createdAt,
              expiresAt: files.expiresAt,
            })
            .from(files)
            .where(eq(files.id, row.outputFileId))
            .limit(1)
        )[0] ?? null);

  const [usage] = await db
    .select({
      apiKeyId: conversionUsageEvents.apiKeyId,
      toolId: conversionUsageEvents.toolId,
      userId: conversionUsageEvents.userId,
    })
    .from(conversionUsageEvents)
    .where(eq(conversionUsageEvents.conversionId, id))
    .limit(1);

  const ownerUser =
    row.ownerKind === "user"
      ? (
          await db
            .select({ id: user.id, email: user.email, name: user.name })
            .from(user)
            .where(eq(user.id, row.ownerId))
            .limit(1)
        )[0]
      : undefined;

  const durationMs =
    row.startedAt !== null && row.completedAt !== null
      ? row.completedAt.getTime() - row.startedAt.getTime()
      : null;

  return {
    execution: {
      id: row.id,
      conversionType: row.conversionType,
      sourceFormat: row.sourceFormat,
      targetFormat: row.targetFormat,
      status: row.status,
      errorCode: row.errorCode,
      errorMessage: row.errorMessage,
      createdAt: row.createdAt,
      queuedAt: row.queuedAt,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      expiresAt: row.expiresAt,
      ownerId: row.ownerId,
      ownerKind: row.ownerKind,
      durationMs,
    },
    owner: {
      kind: row.ownerKind,
      id: row.ownerId,
      email: ownerUser?.email ?? null,
      name: ownerUser?.name ?? null,
      apiKeyId: usage?.apiKeyId ?? null,
      channel:
        row.ownerKind === "anonymous_session"
          ? "anonymous"
          : usage?.apiKeyId !== null && usage?.apiKeyId !== undefined
            ? "api"
            : "web",
    },
    sourceFile: sourceFile ?? null,
    outputFile,
    timeline: [
      { label: "Created", at: row.createdAt },
      { label: "Queued", at: row.queuedAt },
      { label: "Processing", at: row.startedAt },
      { label: "Completed", at: row.completedAt },
      { label: "Expires", at: row.expiresAt },
    ],
  };
}

export async function getExecutionToolStats(toolId: string) {
  const db = getDb();
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      completed: sql<number>`count(*) filter (where ${conversions.status} = 'completed')::int`,
      failed: sql<number>`count(*) filter (where ${conversions.status} = 'failed')::int`,
      averageDurationMs: sql<number | null>`avg(
        extract(epoch from (${conversions.completedAt} - ${conversions.startedAt})) * 1000
      )`,
    })
    .from(conversions)
    .where(eq(conversions.conversionType, toolId));

  return {
    total: countInt(row?.total),
    completed: countInt(row?.completed),
    failed: countInt(row?.failed),
    averageDurationMs: avgNumber(row?.averageDurationMs),
  };
}
