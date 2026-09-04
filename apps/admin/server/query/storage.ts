import { loadRetentionPolicy } from "@sohappypdf/config";
import { conversions, files, getDb } from "@sohappypdf/db";
import {
  FILE_CLEANUP_QUEUE_NAME,
  getAdminQueueCounts,
} from "@sohappypdf/queue";
import { and, isNull, sql } from "drizzle-orm";
import { countInt } from "@/server/query/sql";

export async function getAdminStorageOverview() {
  const db = getDb();
  const now = new Date();
  const expiringSoon = new Date(now.getTime() + 30 * 60 * 1000);
  const policy = loadRetentionPolicy();

  const [
    [temporaryFiles],
    [usage],
    [expiring],
    [expired],
    [deletedPendingPurge],
    [purged],
    recentExpired,
    cleanupQueue,
  ] = await Promise.all([
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
          sql`${files.expiresAt} > ${now}`,
          sql`${files.expiresAt} <= ${expiringSoon}`,
        ),
      ),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(files)
      .where(and(isNull(files.purgedAt), sql`${files.expiresAt} <= ${now}`)),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(files)
      .where(and(isNull(files.purgedAt), sql`${files.deletedAt} is not null`)),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(files)
      .where(sql`${files.purgedAt} is not null`),
    db
      .select({
        id: files.id,
        originalFilename: files.originalFilename,
        sizeBytes: files.sizeBytes,
        status: files.status,
        expiresAt: files.expiresAt,
        deletedAt: files.deletedAt,
      })
      .from(files)
      .where(and(isNull(files.purgedAt), sql`${files.expiresAt} <= ${now}`))
      .orderBy(files.expiresAt)
      .limit(15),
    getAdminQueueCounts(FILE_CLEANUP_QUEUE_NAME).catch(() => null),
  ]);

  const [expiredConversions] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(conversions)
    .where(
      sql`${conversions.expiresAt} is not null and ${conversions.expiresAt} <= ${now}`,
    );

  return {
    retentionHours: Math.round(policy.temporaryMs / (60 * 60 * 1000)),
    temporaryFiles: countInt(temporaryFiles?.value),
    usageBytes: countInt(usage?.value),
    expiringSoon: countInt(expiring?.value),
    expiredUnpurged: countInt(expired?.value),
    deletedPendingPurge: countInt(deletedPendingPurge?.value),
    purgedRecords: countInt(purged?.value),
    expiredConversions: countInt(expiredConversions?.value),
    recentExpired,
    cleanupQueue,
    orphanDetection: {
      available: false,
      reason: "S3 inventory reconciliation is not implemented.",
    },
  };
}
