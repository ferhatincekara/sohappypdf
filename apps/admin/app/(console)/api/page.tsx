import { DataTable } from "@/components/admin/data-table";
import { MetricCard } from "@/components/admin/metric-card";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { Input } from "@/components/ui/input";
import { RevokeApiKeyButton } from "@/features/users/user-actions";
import {
  formatDateTime,
  formatNumber,
  maskApiKeyPrefix,
  shortId,
} from "@/lib/format";
import { withQuery } from "@/lib/query-href";
import { getAdminApiOverview, listAdminApiKeys } from "@/server/query/api";

export default async function ApiPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const [overview, keys] = await Promise.all([
    getAdminApiOverview(),
    listAdminApiKeys(params),
  ]);

  return (
    <>
      <PageHeader
        title="API"
        description="Developer subscriptions, usage, and key metadata. Full secrets are never shown."
      />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="API users" value={formatNumber(overview.apiUsers)} />
        <MetricCard
          label="Active keys"
          value={formatNumber(overview.activeKeys)}
        />
        <MetricCard
          label="API subscriptions"
          value={formatNumber(overview.activeSubscriptions)}
        />
        <MetricCard
          label="Executions today"
          value={formatNumber(overview.executionsToday)}
        />
        <MetricCard
          label="Credits consumed today"
          value={formatNumber(overview.creditsConsumedToday)}
        />
      </section>
      <form className="flex gap-2" method="get">
        <Input
          name="q"
          defaultValue={params.q}
          placeholder="User ID, email, or key ID"
        />
        <button
          type="submit"
          className="h-8 rounded-md bg-foreground px-3 text-sm text-background"
        >
          Search
        </button>
      </form>
      <DataTable
        columns={[
          { id: "name", header: "Key", cell: (row) => row.name },
          {
            id: "prefix",
            header: "Prefix",
            cell: (row) => maskApiKeyPrefix(row.keyPrefix),
          },
          { id: "user", header: "User", cell: (row) => row.email },
          {
            id: "status",
            header: "Status",
            cell: (row) => (
              <StatusBadge value={row.revokedAt ? "revoked" : "active"} />
            ),
          },
          {
            id: "used",
            header: "Last used",
            cell: (row) => formatDateTime(row.lastUsedAt),
          },
          {
            id: "actions",
            header: "",
            cell: (row) =>
              row.revokedAt === null ? (
                <RevokeApiKeyButton
                  apiKeyId={row.id}
                  keyPrefix={row.keyPrefix}
                />
              ) : (
                shortId(row.id)
              ),
          },
        ]}
        rows={keys.rows}
        rowKey={(row) => row.id}
        emptyTitle="No API keys"
        emptyDescription="Keys appear after developers create them."
      />
      <Pagination
        page={keys.page}
        pageCount={keys.pageCount}
        hrefForPage={(page) =>
          withQuery("/api", params, { page: String(page) })
        }
      />
    </>
  );
}
