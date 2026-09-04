import { BarChart } from "@/components/admin/bar-chart";
import { ChartCard } from "@/components/admin/chart-card";
import { DataTable } from "@/components/admin/data-table";
import { MetricCard } from "@/components/admin/metric-card";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { UserCell } from "@/features/identity/user-cell";
import { formatDateTime, formatNumber, shortId } from "@/lib/format";
import { getAdminBillingOverview } from "@/server/query/billing";

export default async function BillingPage() {
  const billing = await getAdminBillingOverview();

  return (
    <>
      <PageHeader
        title="Billing"
        description="Polar subscriptions stored locally. Web Pro and API packs are billed separately."
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
          hint="Catalog list prices × active subscriptions"
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
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Active subscriptions"
          description="Current paid web and API packs."
        >
          <BarChart
            items={[
              {
                key: "pro",
                label: "Web Pro",
                value: billing.web.activePro,
              },
              {
                key: "starter",
                label: "Starter",
                value: billing.api.starter,
              },
              {
                key: "growth",
                label: "Growth",
                value: billing.api.growth,
              },
              { key: "scale", label: "Scale", value: billing.api.scale },
            ]}
          />
        </ChartCard>
        <ChartCard
          title="Recent Polar events"
          description="Latest webhook deliveries written to the database."
        >
          {billing.recentWebhooks.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              No webhook events yet.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {billing.recentWebhooks.slice(0, 8).map((event) => (
                <li
                  key={event.id}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="truncate font-medium">
                    {event.eventType}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {formatDateTime(event.processedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>
      </div>
      <DataTable
        columns={[
          {
            id: "user",
            header: "User",
            cell: (row) => (
              <UserCell email={row.email} name={row.name} image={row.image} />
            ),
          },
          { id: "plan", header: "Plan", cell: (row) => row.plan },
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
          {
            id: "user",
            header: "User",
            cell: (row) => (
              <UserCell email={row.email} name={row.name} image={row.image} />
            ),
          },
          { id: "pack", header: "API pack", cell: (row) => row.productKey },
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
        emptyTitle="No API subscriptions"
        emptyDescription="API packs are independent from Web Pro."
      />
    </>
  );
}
