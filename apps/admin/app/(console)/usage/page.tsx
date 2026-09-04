import { MetricCard } from "@/components/admin/metric-card";
import { PageHeader } from "@/components/admin/page-header";
import { formatDurationMs, formatNumber } from "@/lib/format";
import { getAdminUsageAnalytics } from "@/server/query/usage";

export default async function UsagePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const usage = await getAdminUsageAnalytics(params.range);
  const maxDay = Math.max(...usage.byDay.map((row) => row.total), 1);

  return (
    <>
      <PageHeader
        title="Usage"
        description="Operational product metrics from conversion records. Charts use real counts only."
      />
      <form className="flex flex-wrap gap-2" method="get">
        {usage.presets.map((preset) => (
          <button
            key={preset}
            type="submit"
            name="range"
            value={preset}
            className={`h-10 min-w-16 rounded-md px-3 text-sm sm:h-8 ${
              usage.range.preset === preset
                ? "bg-foreground text-background"
                : "border border-border bg-card"
            }`}
          >
            {preset}
          </button>
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
      <section className="rounded-md border border-border bg-card p-3">
        <h2 className="text-sm font-medium">Executions over time</h2>
        <div className="mt-3 flex h-40 items-end gap-1">
          {usage.byDay.map((day) => (
            <div
              key={day.day}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <div
                className="w-full rounded-sm bg-foreground/80"
                style={{
                  height: `${Math.max((day.total / maxDay) * 100, 4)}%`,
                }}
                title={`${day.day}: ${day.total}`}
              />
              <span className="text-[10px] text-muted-foreground">
                {day.day.slice(5)}
              </span>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-md border border-border bg-card p-3">
        <h2 className="text-sm font-medium">Tool popularity</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {usage.byTool.map((tool) => (
            <li key={tool.tool} className="flex justify-between gap-3">
              <a href={`/tools/${tool.tool}`}>{tool.tool}</a>
              <span>
                {formatNumber(tool.total)} · {formatNumber(tool.failed)} failed
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
