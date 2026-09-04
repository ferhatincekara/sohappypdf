import { DataTable } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { Input } from "@/components/ui/input";
import { formatDateTime, shortId } from "@/lib/format";
import { withQuery } from "@/lib/query-href";
import { listAdminAuditEvents } from "@/server/query/audit";

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const result = await listAdminAuditEvents(params);

  return (
    <>
      <PageHeader
        title="Audit logs"
        description="Append-only administrator actions. Secrets are never stored here."
      />
      <form className="flex flex-wrap gap-2" method="get">
        <Input
          name="action"
          defaultValue={params.action}
          placeholder="Action"
        />
        <Input
          name="actor"
          defaultValue={params.actor}
          placeholder="Actor user ID"
        />
        <button
          type="submit"
          className="h-8 rounded-md bg-foreground px-3 text-sm text-background"
        >
          Filter
        </button>
      </form>
      <DataTable
        columns={[
          {
            id: "time",
            header: "Time",
            cell: (row) => formatDateTime(row.createdAt),
          },
          { id: "admin", header: "Admin", cell: (row) => row.actorEmail },
          { id: "action", header: "Action", cell: (row) => row.action },
          {
            id: "target",
            header: "Target",
            cell: (row) => `${row.targetType} ${shortId(row.targetId)}`,
          },
          {
            id: "result",
            header: "Result",
            cell: (row) => <StatusBadge value={row.result} />,
          },
          { id: "reason", header: "Reason", cell: (row) => row.reason ?? "—" },
        ]}
        rows={result.rows}
        rowKey={(row) => row.id}
        emptyTitle="No audit events"
        emptyDescription="Sensitive admin actions appear here after they run."
      />
      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        hrefForPage={(page) =>
          withQuery("/audit-logs", params, { page: String(page) })
        }
      />
    </>
  );
}
