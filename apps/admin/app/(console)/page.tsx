import { listAdminQueues, listWorkerHeartbeats } from "@sohappypdf/queue";
import { ErrorState } from "@/components/admin/error-state";
import { MetricCard } from "@/components/admin/metric-card";
import { PageHeader } from "@/components/admin/page-header";
import { formatBytes, formatDurationMs, formatNumber } from "@/lib/format";
import { getDashboardMetrics } from "@/server/query/dashboard";

export default async function DashboardPage() {
  try {
    const [metrics, queues, workers] = await Promise.all([
      getDashboardMetrics(),
      listAdminQueues().catch(() => null),
      listWorkerHeartbeats().catch(() => null),
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
          description="What is happening on SoHappyPDF right now. Metrics are counted from live database and queue state."
        />
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
            label="Estimated MRR"
            value={`$${formatNumber(metrics.revenue.estimatedMrrUsd)}`}
            hint="Derived from catalog list prices × active subscriptions"
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
          <MetricCard
            label="Active API subscriptions"
            value={formatNumber(metrics.revenue.activeApiSubscriptions)}
          />
          <MetricCard
            label="Cleanup eligible files"
            value={formatNumber(metrics.storage.eligibleForCleanup)}
          />
        </section>
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
