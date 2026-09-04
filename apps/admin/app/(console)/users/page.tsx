import { DataTable } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { Input } from "@/components/ui/input";
import { formatDateTime, formatNumber, shortId } from "@/lib/format";
import { withQuery } from "@/lib/query-href";
import { listAdminUsers } from "@/server/query/users";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const result = await listAdminUsers(params);

  return (
    <>
      <PageHeader
        title="Users"
        description="Search by email, user ID, or name. Filters stay in the URL."
      />
      <form className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6" method="get">
        <Input
          name="q"
          defaultValue={params.q}
          placeholder="Email, ID, or name"
        />
        <select
          name="plan"
          defaultValue={params.plan ?? ""}
          className="admin-field"
        >
          <option value="">All web plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
        </select>
        <select
          name="developer"
          defaultValue={params.developer ?? ""}
          className="admin-field"
        >
          <option value="">All developer plans</option>
          <option value="none">No developer subscription</option>
          <option value="starter">Starter</option>
          <option value="growth">Growth</option>
          <option value="scale">Scale</option>
        </select>
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="admin-field"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <Input name="from" type="date" defaultValue={params.from} />
        <Input name="to" type="date" defaultValue={params.to} />
        <button
          type="submit"
          className="admin-field bg-foreground text-background"
        >
          Filter
        </button>
      </form>
      <DataTable
        columns={[
          { id: "user", header: "User", cell: (row) => row.email },
          { id: "id", header: "ID", cell: (row) => shortId(row.id) },
          {
            id: "status",
            header: "Status",
            cell: (row) => (
              <StatusBadge value={row.suspendedAt ? "suspended" : "active"} />
            ),
          },
          {
            id: "web",
            header: "Web",
            cell: (row) => <StatusBadge value={row.webPlan} />,
          },
          { id: "dev", header: "Developer", cell: (row) => row.developerPlan },
          {
            id: "credits",
            header: "Credits",
            cell: (row) =>
              `${formatNumber(row.webCreditsRemaining)} web / ${formatNumber(row.apiCreditsRemaining)} API`,
          },
          {
            id: "created",
            header: "Created",
            cell: (row) => formatDateTime(row.createdAt),
          },
          {
            id: "activity",
            header: "Last activity",
            cell: (row) => formatDateTime(row.lastActivityAt),
          },
        ]}
        rows={result.rows}
        rowKey={(row) => row.id}
        href={(row) => `/users/${row.id}`}
        emptyTitle="No users match"
        emptyDescription="Try a different search or filter."
      />
      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        hrefForPage={(page) =>
          withQuery("/users", params, { page: String(page) })
        }
      />
    </>
  );
}
