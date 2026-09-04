import { CONVERSION_STATUSES } from "@sohappypdf/conversions";
import { listCatalogTools } from "@sohappypdf/tools";
import { DataTable } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateTime, formatDurationMs, shortId } from "@/lib/format";
import { withQuery } from "@/lib/query-href";
import { listAdminExecutions } from "@/server/query/executions";

export default async function ExecutionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const result = await listAdminExecutions(params);
  const tools = listCatalogTools();

  return (
    <>
      <PageHeader
        title="Executions"
        description="Operational view of conversion jobs. Statuses are the live internal states."
      />
      <form className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6" method="get">
        <Input
          name="q"
          defaultValue={params.q}
          placeholder="Execution ID, user ID, filename"
        />
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="admin-field"
        >
          <option value="">All statuses</option>
          {CONVERSION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select
          name="tool"
          defaultValue={params.tool ?? ""}
          className="admin-field"
        >
          <option value="">All tools</option>
          {tools.map((tool) => (
            <option key={tool.id} value={tool.id}>
              {tool.id}
            </option>
          ))}
        </select>
        <select
          name="channel"
          defaultValue={params.channel ?? ""}
          className="admin-field"
        >
          <option value="">All channels</option>
          <option value="web">Web</option>
          <option value="api">API</option>
          <option value="anonymous">Anonymous</option>
        </select>
        <select
          name="ownerKind"
          defaultValue={params.ownerKind ?? ""}
          className="admin-field"
        >
          <option value="">All owners</option>
          <option value="user">User</option>
          <option value="anonymous_session">Anonymous session</option>
        </select>
        <Input name="from" type="date" defaultValue={params.from} />
        <Button type="submit">Filter</Button>
      </form>
      <DataTable
        columns={[
          { id: "id", header: "Execution", cell: (row) => shortId(row.id) },
          { id: "tool", header: "Tool", cell: (row) => row.conversionType },
          {
            id: "owner",
            header: "User",
            cell: (row) =>
              row.ownerKind === "user"
                ? (row.ownerEmail ?? shortId(row.ownerId))
                : `Anonymous ${shortId(row.ownerId)}`,
          },
          { id: "channel", header: "Channel", cell: (row) => row.channel },
          {
            id: "status",
            header: "Status",
            cell: (row) => <StatusBadge value={row.status} />,
          },
          {
            id: "created",
            header: "Created",
            cell: (row) => formatDateTime(row.createdAt),
          },
          {
            id: "duration",
            header: "Duration",
            cell: (row) => formatDurationMs(row.durationMs),
          },
          { id: "error", header: "Error", cell: (row) => row.errorCode ?? "—" },
        ]}
        rows={result.rows}
        rowKey={(row) => row.id}
        href={(row) => `/executions/${row.id}`}
        emptyTitle="No executions match"
        emptyDescription="Try a different filter. No fake jobs are shown."
      />
      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        hrefForPage={(page) =>
          withQuery("/executions", params, { page: String(page) })
        }
      />
    </>
  );
}
