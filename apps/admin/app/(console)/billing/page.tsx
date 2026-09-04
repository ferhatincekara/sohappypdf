import { DataTable } from "@/components/admin/data-table";
import { MetricCard } from "@/components/admin/metric-card";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatDateTime, formatNumber, shortId } from "@/lib/format";
import { getAdminBillingOverview } from "@/server/query/billing";

export default async function BillingPage() {
  const billing = await getAdminBillingOverview();

  return (
    <>
      <PageHeader
        title="Billing"
        description="Local Polar subscription records. Web Pro and developer API packs are separate."
      />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active Pro"
          value={formatNumber(billing.web.activePro)}
        />
        <MetricCard
          label="New Pro today"
          value={formatNumber(billing.web.newToday)}
        />
        <MetricCard
          label="Canceled web subs"
          value={formatNumber(billing.web.canceled)}
        />
        <MetricCard
          label="Estimated MRR"
          value={`$${formatNumber(billing.estimatedMrrUsd)}`}
          hint="Derived from catalog list prices × active subscriptions"
        />
        <MetricCard
          label="API Starter"
          value={formatNumber(billing.api.starter)}
        />
        <MetricCard
          label="API Growth"
          value={formatNumber(billing.api.growth)}
        />
        <MetricCard label="API Scale" value={formatNumber(billing.api.scale)} />
      </section>
      <DataTable
        columns={[
          { id: "user", header: "User", cell: (row) => shortId(row.userId) },
          { id: "plan", header: "Web plan", cell: (row) => row.plan },
          {
            id: "status",
            header: "Status",
            cell: (row) => <StatusBadge value={row.status} />,
          },
          {
            id: "polar",
            header: "Polar",
            cell: (row) => shortId(row.polarSubscriptionId),
          },
          {
            id: "renewal",
            header: "Period end",
            cell: (row) => formatDateTime(row.currentPeriodEnd),
          },
        ]}
        rows={billing.recentWebSubscriptions}
        rowKey={(row) => row.id}
        href={(row) => `/users/${row.userId}`}
        emptyTitle="No web subscriptions"
        emptyDescription="Web subscription events appear after Polar webhooks."
      />
      <DataTable
        columns={[
          { id: "user", header: "User", cell: (row) => shortId(row.userId) },
          { id: "pack", header: "Developer", cell: (row) => row.productKey },
          {
            id: "status",
            header: "Status",
            cell: (row) => <StatusBadge value={row.status} />,
          },
          {
            id: "polar",
            header: "Polar",
            cell: (row) => shortId(row.polarSubscriptionId),
          },
          {
            id: "renewal",
            header: "Period end",
            cell: (row) => formatDateTime(row.currentPeriodEnd),
          },
        ]}
        rows={billing.recentApiSubscriptions}
        rowKey={(row) => row.id}
        href={(row) => `/users/${row.userId}`}
        emptyTitle="No developer subscriptions"
        emptyDescription="API packs are independent from Web Pro."
      />
    </>
  );
}
