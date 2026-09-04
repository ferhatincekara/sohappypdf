"use client";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  pauseQueueAction,
  removeQueueJobAction,
  resumeQueueAction,
  retryQueueJobAction,
} from "@/server/actions/queues";

export function PauseQueueButton({
  queueName,
  label,
}: {
  queueName: string;
  label: string;
}) {
  return (
    <ConfirmDialog
      title={`Pause ${label}`}
      triggerLabel="Pause"
      confirmLabel="Pause queue"
      pendingLabel="Pausing…"
      description={
        <p>
          New jobs will wait until this queue is resumed. In-flight jobs keep
          processing. This does not edit job payloads.
        </p>
      }
      onConfirm={async () => {
        await pauseQueueAction(queueName);
      }}
    />
  );
}

export function ResumeQueueButton({
  queueName,
  label,
}: {
  queueName: string;
  label: string;
}) {
  return (
    <ConfirmDialog
      title={`Resume ${label}`}
      triggerLabel="Resume"
      confirmLabel="Resume queue"
      pendingLabel="Resuming…"
      description={<p>Waiting jobs in {label} will start processing again.</p>}
      onConfirm={async () => {
        await resumeQueueAction(queueName);
      }}
    />
  );
}

export function RetryJobButton({
  queueName,
  jobId,
}: {
  queueName: string;
  jobId: string;
}) {
  return (
    <ConfirmDialog
      title="Retry failed job"
      triggerLabel="Retry"
      confirmLabel="Retry job"
      pendingLabel="Retrying…"
      description={
        <p>
          Job {jobId} will be retried on {queueName}. The payload cannot be
          edited from this console.
        </p>
      }
      onConfirm={async () => {
        await retryQueueJobAction({ queueName, jobId });
      }}
    />
  );
}

export function RemoveJobButton({
  queueName,
  jobId,
}: {
  queueName: string;
  jobId: string;
}) {
  return (
    <ConfirmDialog
      title="Remove dead job"
      triggerLabel="Remove"
      triggerVariant="destructive"
      confirmLabel="Remove job"
      pendingLabel="Removing…"
      destructive
      description={
        <p>
          Job {jobId} will be removed from {queueName}. This does not delete the
          conversion record.
        </p>
      }
      onConfirm={async () => {
        await removeQueueJobAction({ queueName, jobId });
      }}
    />
  );
}
