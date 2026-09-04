import { listAdminQueues, listWorkerHeartbeats } from "@sohappypdf/queue";
import { BarChart, RankedBars } from "@/components/admin/bar-chart";
import { ChartCard } from "@/components/admin/chart-card";
import { ErrorState } from "@/components/admin/error-state";
import { MetricCard, MetricSection } from "@/components/admin/metric-card";
import { PageHeader } from "@/components/admin/page-header";
import { formatBytes, formatDurationMs, formatNumber } from "@/lib/format";
import { getDashboardMetrics } from "@/server/query/dashboard";
import { getAdminUsageAnalytics } from "@/server/query/usage";

export default async function DashboardPage() {
  try {
    const [metrics, queues, workers, usage] = await Promise.all([
      getDashboardMetrics(),
      listAdminQueues().catch(() => null),
      listWorkerHeartbeats().catch(() => null),
      getAdminUsageAnalytics("7d"),
    ]);

    const queueBacklog =
      queues === null
        ? null
        : queues.reduce((total, queue) => total + queue.counts.waiting, 0);
    const healthyWorkers =
      workers === null
        ? null
        : workers.filter((worker) => worker.status === "healthy").length;
    const unhealthyWorkers =
      workers === null
        ? null
        : workers.filter((worker) => worker.status !== "healthy").length;

    return (
      <>
        <PageHeader
          title="Overview"
          description="Live operations snapshot from the database, queues, and workers."
        />
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <ChartCard
              title="Executions · 7 days"
              description="Completed and failed jobs counted from conversion records."
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
          <ChartCard
            title="Top tools"
            description="Most used tools in the last 7 days."
          >
            <RankedBars
              items={usage.byTool.slice(0, 6).map((tool) => ({
                key: tool.tool,
                label: tool.tool,
                value: tool.total,
              }))}
            />
          </ChartCard>
        </div>
        <MetricSection title="People">
          <MetricCard
            label="Users"
            value={formatNumber(metrics.users.total)}
            hint={`${formatNumber(metrics.users.newToday)} new today`}
          />
          <MetricCard
            label="Active users today"
            value={formatNumber(metrics.users.activeToday)}
            hint="Users with an execution today"
          />
          <MetricCard
            label="Pro users"
            value={formatNumber(metrics.users.pro)}
            hint="Active web Pro subscriptions"
          />
          <MetricCard
            label="Anonymous sessions"
            value={formatNumber(metrics.anonymous.activeSessions)}
            hint={`${formatNumber(metrics.anonymous.executionsToday)} executions today`}
          />
        </MetricSection>
        <MetricSection title="Processing">
          <MetricCard
            label="Executions today"
            value={formatNumber(metrics.processing.executionsToday)}
            hint={`${formatNumber(metrics.processing.processingNow)} processing now`}
          />
          <MetricCard
            label="Completed today"
            value={formatNumber(metrics.processing.completedToday)}
          />
          <MetricCard
            label="Failed today"
            value={formatNumber(metrics.processing.failedToday)}
          />
          <MetricCard
            label="Avg processing time"
            value={formatDurationMs(metrics.processing.averageDurationMs)}
            hint={
              metrics.processing.averageDurationMs === null
                ? "No completed jobs today"
                : "Completed jobs today"
            }
          />
        </MetricSection>
        <MetricSection title="Workers and storage">
          <MetricCard
            label="Active workers"
            value={
              healthyWorkers === null
                ? "Unavailable"
                : formatNumber(healthyWorkers)
            }
            unavailable={healthyWorkers === null}
            hint={
              unhealthyWorkers === null
                ? "Worker heartbeats require Redis"
                : `${formatNumber(unhealthyWorkers)} stale or offline`
            }
          />
          <MetricCard
            label="Queue backlog"
            value={
              queueBacklog === null ? "Unavailable" : formatNumber(queueBacklog)
            }
            unavailable={queueBacklog === null}
            hint="Waiting jobs across conversion and cleanup"
          />
          <MetricCard
            label="Temporary files"
            value={formatNumber(metrics.storage.temporaryFiles)}
            hint={`${formatBytes(metrics.storage.usageBytes)} · ${formatNumber(metrics.storage.expiringSoon)} expiring soon`}
          />
          <MetricCard
            label="Cleanup eligible files"
            value={formatNumber(metrics.storage.eligibleForCleanup)}
          />
        </MetricSection>
        <MetricSection title="Revenue and API">
          <MetricCard
            label="Estimated MRR"
            value={`$${formatNumber(metrics.revenue.estimatedMrrUsd)}`}
            hint="Derived from catalog list prices × active subscriptions"
          />
          <MetricCard
            label="Active API subscriptions"
            value={formatNumber(metrics.revenue.activeApiSubscriptions)}
          />
          <MetricCard
            label="API executions today"
            value={formatNumber(metrics.api.executionsToday)}
            hint={`${formatNumber(metrics.api.errorsToday)} failed`}
          />
          <MetricCard
            label="API credits consumed"
            value={formatNumber(metrics.api.creditsConsumedToday)}
            hint="Ledger consume entries today"
          />
        </MetricSection>
      </>
    );
  } catch {
    return (
      <ErrorState
        title="Unable to load overview"
        description="The operations snapshot could not be loaded. Try again shortly."
      />
    );
  }
}
