import { DataTable } from "@/components/admin/data-table";
import { MetricCard } from "@/components/admin/metric-card";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  formatBytes,
  formatDateTime,
  formatNumber,
  shortId,
} from "@/lib/format";
import { getAdminStorageOverview } from "@/server/query/storage";

export default async function StoragePage() {
  const storage = await getAdminStorageOverview();

  return (
    <>
      <PageHeader
        title="Storage"
        description={`Temporary processing assets, not a document library. Normal retention is about ${storage.retentionHours} hours. S3 lifecycle is a safety net.`}
      />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Temporary files"
          value={formatNumber(storage.temporaryFiles)}
        />
        <MetricCard
          label="Storage usage"
          value={formatBytes(storage.usageBytes)}
        />
        <MetricCard
          label="Expiring soon"
          value={formatNumber(storage.expiringSoon)}
          hint="Next 30 minutes"
        />
        <MetricCard
          label="Expired, not purged"
          value={formatNumber(storage.expiredUnpurged)}
        />
        <MetricCard
          label="Deleted pending purge"
          value={formatNumber(storage.deletedPendingPurge)}
        />
        <MetricCard
          label="Expired conversions"
          value={formatNumber(storage.expiredConversions)}
        />
        <MetricCard
          label="Cleanup queue"
          value={
            storage.cleanupQueue === null
              ? "Unavailable"
              : formatNumber(storage.cleanupQueue.failed)
          }
          unavailable={storage.cleanupQueue === null}
          hint={
            storage.cleanupQueue === null
              ? "Queue service unavailable"
              : `${formatNumber(storage.cleanupQueue.waiting)} waiting · ${formatNumber(storage.cleanupQueue.failed)} failed`
          }
        />
        <MetricCard
          label="Orphaned objects"
          value="Unavailable"
          unavailable
          hint={storage.orphanDetection.reason}
        />
      </section>
      <DataTable
        columns={[
          { id: "id", header: "File", cell: (row) => shortId(row.id) },
          {
            id: "name",
            header: "Filename",
            cell: (row) => row.originalFilename,
          },
          {
            id: "size",
            header: "Size",
            cell: (row) => formatBytes(row.sizeBytes),
          },
          {
            id: "status",
            header: "Status",
            cell: (row) => <StatusBadge value={row.status} />,
          },
          {
            id: "expires",
            header: "Expired",
            cell: (row) => formatDateTime(row.expiresAt),
          },
        ]}
        rows={storage.recentExpired}
        rowKey={(row) => row.id}
        emptyTitle="No stuck expired files"
        emptyDescription="Expired files are waiting on the cleanup worker when they appear here."
      />
    </>
  );
}
