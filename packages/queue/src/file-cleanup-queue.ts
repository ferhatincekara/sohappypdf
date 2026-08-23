import { Queue } from "bullmq";
import type { FileCleanupJobData } from "./file-cleanup-job.js";
import { getQueueConnection } from "./queue-connection.js";
import {
  CONVERSION_COMPLETED_JOB_RETENTION,
  CONVERSION_FAILED_JOB_RETENTION,
  CONVERSION_JOB_BACKOFF,
  FILE_CLEANUP_INTERVAL_MS,
  FILE_CLEANUP_JOB_ATTEMPTS,
  FILE_CLEANUP_JOB_NAME,
  FILE_CLEANUP_QUEUE_NAME,
  FILE_CLEANUP_SCHEDULER_ID,
} from "./queue-settings.js";

let fileCleanupQueue: Queue<FileCleanupJobData> | undefined;

export function getFileCleanupQueue(): Queue<FileCleanupJobData> {
  if (fileCleanupQueue === undefined) {
    fileCleanupQueue = new Queue<FileCleanupJobData>(FILE_CLEANUP_QUEUE_NAME, {
      connection: getQueueConnection("producer"),
      defaultJobOptions: {
        attempts: FILE_CLEANUP_JOB_ATTEMPTS,
        backoff: {
          type: CONVERSION_JOB_BACKOFF.type,
          delay: CONVERSION_JOB_BACKOFF.delay,
        },
        removeOnComplete: {
          count: CONVERSION_COMPLETED_JOB_RETENTION.count,
          age: CONVERSION_COMPLETED_JOB_RETENTION.age,
        },
        removeOnFail: {
          count: CONVERSION_FAILED_JOB_RETENTION.count,
          age: CONVERSION_FAILED_JOB_RETENTION.age,
        },
      },
    });
  }

  return fileCleanupQueue;
}

export async function scheduleFileCleanup(): Promise<void> {
  await getFileCleanupQueue().upsertJobScheduler(
    FILE_CLEANUP_SCHEDULER_ID,
    { every: FILE_CLEANUP_INTERVAL_MS },
    {
      name: FILE_CLEANUP_JOB_NAME,
      data: {},
    },
  );
}

export async function closeFileCleanupQueue(): Promise<void> {
  if (fileCleanupQueue === undefined) {
    return;
  }

  const queue = fileCleanupQueue;
  fileCleanupQueue = undefined;
  await queue.close();
}
