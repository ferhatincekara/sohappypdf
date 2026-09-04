import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import type { Queue } from "bullmq";
import { conversionIdFromJobData } from "./conversion-job.js";
import { getConversionQueue } from "./conversion-queue.js";
import { getFileCleanupQueue } from "./file-cleanup-queue.js";
import {
  CONVERSION_QUEUE_NAME,
  FILE_CLEANUP_QUEUE_NAME,
} from "./queue-settings.js";

export const ADMIN_QUEUE_NAMES = [
  CONVERSION_QUEUE_NAME,
  FILE_CLEANUP_QUEUE_NAME,
] as const;

export type AdminQueueName = (typeof ADMIN_QUEUE_NAMES)[number];

export type AdminQueueCounts = {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
};

export type AdminQueueSummary = {
  name: AdminQueueName;
  label: string;
  counts: AdminQueueCounts;
  oldestWaitingJob: AdminQueueJobSummary | null;
};

export type AdminQueueJobSummary = {
  id: string;
  name: string;
  queueName: AdminQueueName;
  state: string;
  attemptsMade: number;
  timestamp: number | null;
  processedOn: number | null;
  finishedOn: number | null;
  failedReason: string | null;
  conversionId: string | null;
};

const QUEUE_LABELS: Record<AdminQueueName, string> = {
  [CONVERSION_QUEUE_NAME]: "PDF processing",
  [FILE_CLEANUP_QUEUE_NAME]: "File cleanup",
};

function isAdminQueueName(value: string): value is AdminQueueName {
  return (ADMIN_QUEUE_NAMES as readonly string[]).includes(value);
}

function getAdminQueue(name: string): Queue {
  if (!isAdminQueueName(name)) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Unknown queue",
    });
  }

  return name === CONVERSION_QUEUE_NAME
    ? getConversionQueue()
    : getFileCleanupQueue();
}

function sanitizeFailedReason(reason: string | undefined): string | null {
  if (reason === undefined || reason.trim().length === 0) {
    return null;
  }

  const trimmed = reason.trim();

  if (
    /redis:\/\//i.test(trimmed) ||
    /postgres(?:ql)?:\/\//i.test(trimmed) ||
    /AKIA[A-Z0-9]{8,}/.test(trimmed) ||
    /X-Amz-Signature/i.test(trimmed)
  ) {
    return "Job failed";
  }

  return trimmed.slice(0, 280);
}

function toJobSummary(
  queueName: AdminQueueName,
  job: {
    id?: string;
    name: string;
    data: unknown;
    attemptsMade: number;
    timestamp?: number;
    processedOn?: number;
    finishedOn?: number;
    failedReason?: string;
  },
  state: string,
): AdminQueueJobSummary {
  return {
    id: job.id ?? "unknown",
    name: job.name,
    queueName,
    state,
    attemptsMade: job.attemptsMade,
    timestamp: job.timestamp ?? null,
    processedOn: job.processedOn ?? null,
    finishedOn: job.finishedOn ?? null,
    failedReason: sanitizeFailedReason(job.failedReason),
    conversionId: conversionIdFromJobData(job.data) ?? null,
  };
}

export async function getAdminQueueCounts(
  name: AdminQueueName,
): Promise<AdminQueueCounts> {
  const queue = getAdminQueue(name);
  const [counts, paused] = await Promise.all([
    queue.getJobCounts("waiting", "active", "completed", "failed", "delayed"),
    queue.isPaused(),
  ]);

  return {
    waiting: counts.waiting ?? 0,
    active: counts.active ?? 0,
    completed: counts.completed ?? 0,
    failed: counts.failed ?? 0,
    delayed: counts.delayed ?? 0,
    paused,
  };
}

export async function listAdminQueues(): Promise<AdminQueueSummary[]> {
  return Promise.all(
    ADMIN_QUEUE_NAMES.map(async (name) => {
      const queue = getAdminQueue(name);
      const counts = await getAdminQueueCounts(name);
      const waiting = await queue.getWaiting(0, 0);
      const oldest = waiting[0];

      return {
        name,
        label: QUEUE_LABELS[name],
        counts,
        oldestWaitingJob:
          oldest === undefined ? null : toJobSummary(name, oldest, "waiting"),
      };
    }),
  );
}

export async function inspectAdminQueueJob(input: {
  queueName: string;
  jobId: string;
}): Promise<AdminQueueJobSummary> {
  const name = input.queueName;
  const queue = getAdminQueue(name);
  const job = await queue.getJob(input.jobId);

  if (job === undefined) {
    throw new AppError({
      code: APP_ERROR_CODES.NOT_FOUND,
      message: "Queue job not found",
    });
  }

  return toJobSummary(name as AdminQueueName, job, await job.getState());
}

export async function retryAdminQueueJob(input: {
  queueName: string;
  jobId: string;
}): Promise<AdminQueueJobSummary> {
  const name = input.queueName;
  const queue = getAdminQueue(name);
  const job = await queue.getJob(input.jobId);

  if (job === undefined) {
    throw new AppError({
      code: APP_ERROR_CODES.NOT_FOUND,
      message: "Queue job not found",
    });
  }

  await job.retry();
  return toJobSummary(name as AdminQueueName, job, await job.getState());
}

export async function removeAdminQueueJob(input: {
  queueName: string;
  jobId: string;
}): Promise<void> {
  const queue = getAdminQueue(input.queueName);
  const job = await queue.getJob(input.jobId);

  if (job === undefined) {
    throw new AppError({
      code: APP_ERROR_CODES.NOT_FOUND,
      message: "Queue job not found",
    });
  }

  await job.remove();
}

export async function pauseAdminQueue(queueName: string): Promise<void> {
  await getAdminQueue(queueName).pause();
}

export async function resumeAdminQueue(queueName: string): Promise<void> {
  await getAdminQueue(queueName).resume();
}

export function getAdminQueueLabel(name: AdminQueueName): string {
  return QUEUE_LABELS[name];
}
