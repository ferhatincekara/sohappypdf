import { listWorkerHeartbeats } from "@sohappypdf/queue";
import { DataTable } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { ErrorState } from "@/components/admin/error-state";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatDateTime, formatNumber } from "@/lib/format";

export default async function WorkersPage() {
  try {
    const workers = await listWorkerHeartbeats();

    return (
      <>
        <PageHeader
          title="Workers"
          description="Heartbeats are written to Redis by the conversion worker. No heartbeat means the worker is not publishing, not that a fake healthy fleet exists."
        />
        {workers.length === 0 ? (
          <EmptyState
            title="No worker heartbeats"
            description="Workers publish a heartbeat when Redis is available. The HTTP health endpoint is shown on System."
          />
        ) : (
          <DataTable
            columns={[
              { id: "id", header: "Worker", cell: (row) => row.id },
              {
                id: "status",
                header: "Status",
                cell: (row) => <StatusBadge value={row.status} />,
              },
              {
                id: "seen",
                header: "Heartbeat",
                cell: (row) => formatDateTime(row.lastSeenAt),
              },
              {
                id: "queue",
                header: "Queues",
                cell: (row) => row.queues.join(", "),
              },
              {
                id: "job",
                header: "Current job",
                cell: (row) => row.currentJobId ?? "—",
              },
              {
                id: "started",
                header: "Started",
                cell: (row) => formatDateTime(row.startedAt),
              },
              {
                id: "processed",
                header: "Processed",
                cell: (row) => formatNumber(row.processedCount),
              },
              {
                id: "failed",
                header: "Failed",
                cell: (row) => formatNumber(row.failedCount),
              },
            ]}
            rows={workers}
            rowKey={(row) => row.id}
            emptyTitle="No worker heartbeats"
            emptyDescription="Workers publish a heartbeat when Redis is available."
          />
        )}
      </>
    );
  } catch {
    return (
      <ErrorState
        title="Unable to load workers"
        description="Queue service is temporarily unavailable."
      />
    );
  }
}
