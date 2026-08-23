import { assertServerOnly } from "@repo/core";

assertServerOnly("@repo/queue");

export { closeQueues } from "./close-queues.js";
export type {
  ConversionJob,
  ConversionJobData,
  ConversionJobOptions,
} from "./conversion-job.js";
export {
  createConversionJob,
  createConversionJobId,
  parseConversionJobData,
} from "./conversion-job.js";
export type {
  ConversionJobWriter,
  EnqueueConversionResult,
} from "./conversion-queue.js";
export {
  createConversionEnqueue,
  enqueueConversion,
} from "./conversion-queue.js";
export type {
  ConversionJobProcessor,
  ConversionWorker,
  ConversionWorkerHooks,
  ConversionWorkerJob,
  CreateConversionWorkerOptions,
} from "./conversion-worker.js";
export { createConversionWorker } from "./conversion-worker.js";
export type { FileCleanupJobData } from "./file-cleanup-job.js";
export {
  createFileCleanupJob,
  parseFileCleanupJobData,
} from "./file-cleanup-job.js";
export {
  closeFileCleanupQueue,
  scheduleFileCleanup,
} from "./file-cleanup-queue.js";
export type {
  CreateFileCleanupWorkerOptions,
  FileCleanupJobProcessor,
  FileCleanupWorkerJob,
} from "./file-cleanup-worker.js";
export { createFileCleanupWorker } from "./file-cleanup-worker.js";
export type {
  QueueConnectionOptions,
  QueueConnectionRole,
} from "./queue-connection.js";
export {
  closeQueueConnections,
  createQueueConnectionOptions,
  getQueueConnection,
  getQueueConnectionOptions,
  pingQueueConnection,
} from "./queue-connection.js";
export type { ConversionQueueSettings } from "./queue-settings.js";
export {
  CONVERSION_COMPLETED_JOB_RETENTION,
  CONVERSION_FAILED_JOB_RETENTION,
  CONVERSION_JOB_ATTEMPTS,
  CONVERSION_JOB_BACKOFF,
  CONVERSION_JOB_BACKOFF_DELAY_MS,
  CONVERSION_JOB_NAME,
  CONVERSION_QUEUE_NAME,
  CONVERSION_QUEUE_SETTINGS,
  FILE_CLEANUP_INTERVAL_MS,
  FILE_CLEANUP_JOB_ATTEMPTS,
  FILE_CLEANUP_JOB_NAME,
  FILE_CLEANUP_MAX_BATCHES_PER_JOB,
  FILE_CLEANUP_QUEUE_NAME,
  FILE_CLEANUP_SCHEDULER_ID,
} from "./queue-settings.js";
