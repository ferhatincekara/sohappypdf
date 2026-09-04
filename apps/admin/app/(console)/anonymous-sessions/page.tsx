import { DataTable } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { formatDateTime, formatNumber, shortId } from "@/lib/format";
import { withQuery } from "@/lib/query-href";
import { listAdminAnonymousSessions } from "@/server/query/anonymous-sessions";

export default async function AnonymousSessionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const result = await listAdminAnonymousSessions(params);

  return (
    <>
      <PageHeader
        title="Anonymous sessions"
        description="Temporary anonymous processing sessions. Token hashes are never shown."
      />
      <DataTable
        columns={[
          { id: "id", header: "Session", cell: (row) => shortId(row.id) },
          {
            id: "created",
            header: "Created",
            cell: (row) => formatDateTime(row.createdAt),
          },
          {
            id: "seen",
            header: "Last activity",
            cell: (row) => formatDateTime(row.lastSeenAt),
          },
          {
            id: "executions",
            header: "Executions",
            cell: (row) => formatNumber(row.executionCount),
          },
          {
            id: "files",
            header: "Active files",
            cell: (row) => formatNumber(row.activeFiles),
          },
          {
            id: "expires",
            header: "Expires",
            cell: (row) => formatDateTime(row.expiresAt),
          },
        ]}
        rows={result.rows}
        rowKey={(row) => row.id}
        href={(row) => `/anonymous-sessions/${row.id}`}
        emptyTitle="No anonymous sessions"
        emptyDescription="Sessions appear when anonymous tools are used."
      />
      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        hrefForPage={(page) =>
          withQuery("/anonymous-sessions", params, { page: String(page) })
        }
      />
    </>
  );
}
