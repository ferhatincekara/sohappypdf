import { DataTable } from "@/components/admin/data-table";
import { ErrorState } from "@/components/admin/error-state";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserCell } from "@/features/identity/user-cell";
import { formatDateTime, formatNumber } from "@/lib/format";
import { withQuery } from "@/lib/query-href";
import { listAdminUsers } from "@/server/query/users";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  try {
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
          <Button type="submit">Filter</Button>
        </form>
        <DataTable
          columns={[
            {
              id: "user",
              header: "User",
              cell: (row) => (
                <UserCell email={row.email} name={row.name} image={row.image} />
              ),
            },
            {
              id: "status",
              header: "Status",
              cell: (row) => (
                <StatusBadge value={row.suspendedAt ? "suspended" : "active"} />
              ),
            },
            {
              id: "web",
              header: "Plan",
              cell: (row) => <StatusBadge value={row.webPlan} />,
            },
            {
              id: "dev",
              header: "API pack",
              cell: (row) =>
                row.developerPlan === "none" ? "Included" : row.developerPlan,
            },
            {
              id: "web-tools",
              header: "Web tools",
              cell: (row) =>
                row.dailyOperationsLimit === null
                  ? "Unlimited"
                  : `${formatNumber(row.dailyOperationsUsed)} / ${formatNumber(row.dailyOperationsLimit)} today`,
            },
            {
              id: "api-credits",
              header: "API credits",
              cell: (row) => formatNumber(row.apiCreditsRemaining),
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
  } catch {
    return (
      <ErrorState
        title="Unable to load users"
        description="The user list could not be loaded. Try again shortly."
      />
    );
  }
}
