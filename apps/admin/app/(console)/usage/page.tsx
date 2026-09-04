import { BarChart, RankedBars } from "@/components/admin/bar-chart";
import { ChartCard } from "@/components/admin/chart-card";
import { MetricCard } from "@/components/admin/metric-card";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { formatDurationMs, formatNumber } from "@/lib/format";
import { getAdminUsageAnalytics } from "@/server/query/usage";

export default async function UsagePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const usage = await getAdminUsageAnalytics(params.range);

  return (
    <>
      <PageHeader
        title="Usage"
        description="Operational product metrics from conversion records. Charts use real counts only."
      />
      <form className="flex flex-wrap gap-2" method="get">
        {usage.presets.map((preset) => (
          <Button
            key={preset}
            type="submit"
            name="range"
            value={preset}
            variant={usage.range.preset === preset ? "default" : "outline"}
          >
            {preset}
          </Button>
        ))}
      </form>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Executions"
          value={formatNumber(usage.totals.total)}
        />
        <MetricCard
          label="Success rate"
          value={
            usage.totals.successRate === null
              ? "Unavailable"
              : `${usage.totals.successRate.toFixed(1)}%`
          }
        />
        <MetricCard
          label="Failure rate"
          value={
            usage.totals.failureRate === null
              ? "Unavailable"
              : `${usage.totals.failureRate.toFixed(1)}%`
          }
        />
        <MetricCard
          label="Avg duration"
          value={formatDurationMs(usage.totals.averageDurationMs)}
        />
        <MetricCard label="Web" value={formatNumber(usage.totals.web)} />
        <MetricCard label="API" value={formatNumber(usage.totals.api)} />
        <MetricCard
          label="Anonymous"
          value={formatNumber(usage.totals.anonymous)}
        />
        <MetricCard
          label="Authenticated"
          value={formatNumber(usage.totals.authenticated)}
        />
      </section>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ChartCard
            title="Executions over time"
            description="Daily conversion volume for the selected range."
          >
            <BarChart
              items={usage.byDay.map((day) => ({
                key: day.day,
                label: day.day.slice(5),
                value: day.total,
              }))}
            />
          </ChartCard>
        </div>
        <ChartCard title="Tool popularity" description="Most used tools.">
          <RankedBars
            items={usage.byTool.map((tool) => ({
              key: tool.tool,
              label: tool.tool,
              value: tool.total,
            }))}
          />
        </ChartCard>
      </div>
    </>
  );
}
