import { inspectAdminQueueJob, listAdminQueues } from "@sohappypdf/queue";
import { ErrorState } from "@/components/admin/error-state";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  PauseQueueButton,
  RemoveJobButton,
  ResumeQueueButton,
  RetryJobButton,
} from "@/features/queues/queue-actions";
import { formatDateTime, formatNumber } from "@/lib/format";

export default async function QueuesPage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string; queue?: string }>;
}) {
  const params = await searchParams;

  try {
    const queues = await listAdminQueues();
    const inspected =
      params.job !== undefined && params.queue !== undefined
        ? await inspectAdminQueueJob({
            queueName: params.queue,
            jobId: params.job,
          }).catch(() => null)
        : null;

    return (
      <>
        <PageHeader
          title="Queues"
          description="Live BullMQ counts. Destructive actions require confirmation and are audited."
        />
        <div className="space-y-4">
          {queues.map((queue) => (
            <section
              key={queue.name}
              className="rounded-md border border-border bg-card p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{queue.label}</h2>
                  <p className="text-xs text-muted-foreground">{queue.name}</p>
                </div>
                <div className="flex gap-2">
                  {queue.counts.paused ? (
                    <ResumeQueueButton
                      queueName={queue.name}
                      label={queue.label}
                    />
                  ) : (
                    <PauseQueueButton
                      queueName={queue.name}
                      label={queue.label}
                    />
                  )}
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-6">
                <div>
                  <dt className="text-muted-foreground">Waiting</dt>
                  <dd>{formatNumber(queue.counts.waiting)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Active</dt>
                  <dd>{formatNumber(queue.counts.active)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Completed</dt>
                  <dd>{formatNumber(queue.counts.completed)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Failed</dt>
                  <dd>{formatNumber(queue.counts.failed)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Delayed</dt>
                  <dd>{formatNumber(queue.counts.delayed)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Paused</dt>
                  <dd>
                    <StatusBadge
                      value={queue.counts.paused ? "warning" : "active"}
                    />
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-sm text-muted-foreground">
                Oldest waiting:{" "}
                {queue.oldestWaitingJob === null
                  ? "None"
                  : `${queue.oldestWaitingJob.id} · ${queue.oldestWaitingJob.conversionId ?? "no conversion"}`}
              </p>
              {queue.oldestWaitingJob !== null &&
              queue.oldestWaitingJob.conversionId !== null ? (
                <a
                  className="text-sm"
                  href={`/executions/${queue.oldestWaitingJob.conversionId}`}
                >
                  Open related execution
                </a>
              ) : null}
            </section>
          ))}
        </div>
        {inspected !== null ? (
          <section className="rounded-md border border-border bg-card p-3">
            <h2 className="font-semibold">Inspected job</h2>
            <p className="mt-1 text-sm">
              {inspected.id} · {inspected.state} · attempts{" "}
              {inspected.attemptsMade}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatDateTime(
                inspected.timestamp === null
                  ? null
                  : new Date(inspected.timestamp),
              )}
            </p>
            {inspected.failedReason !== null ? (
              <p className="mt-2 text-sm">{inspected.failedReason}</p>
            ) : null}
            {inspected.conversionId !== null ? (
              <a
                className="text-sm"
                href={`/executions/${inspected.conversionId}`}
              >
                Open execution
              </a>
            ) : null}
            <div className="mt-3 flex gap-2">
              <RetryJobButton
                queueName={inspected.queueName}
                jobId={inspected.id}
              />
              <RemoveJobButton
                queueName={inspected.queueName}
                jobId={inspected.id}
              />
            </div>
          </section>
        ) : null}
      </>
    );
  } catch {
    return (
      <ErrorState
        title="Unable to load queues"
        description="Queue service is temporarily unavailable."
      />
    );
  }
}
