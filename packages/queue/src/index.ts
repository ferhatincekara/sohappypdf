import { assertServerOnly } from "@sohappypdf/core";

assertServerOnly("@sohappypdf/queue");

export { closeQueues } from "./close-queues.js";
export type {
  ConversionJob,
  ConversionJobData,
  ConversionJobOptions,
} from "./conversion-job.js";
export {
  conversionIdFromJobData,
  createConversionJob,
  createConversionJobId,
  parseConversionJobData,
  toQueueSafeJobOptions,
} from "./conversion-job.js";
export type {
  ConversionJobWriter,
  ConversionQueueCounts,
  EnqueueConversionResult,
} from "./conversion-queue.js";
export {
  createConversionEnqueue,
  enqueueConversion,
  getConversionQueue,
  getConversionQueueCounts,
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
  getFileCleanupQueue,
  scheduleFileCleanup,
} from "./file-cleanup-queue.js";
export type {
  CreateFileCleanupWorkerOptions,
  FileCleanupJobProcessor,
  FileCleanupWorkerJob,
} from "./file-cleanup-worker.js";
export { createFileCleanupWorker } from "./file-cleanup-worker.js";
export type {
  AdminQueueCounts,
  AdminQueueJobSummary,
  AdminQueueName,
  AdminQueueSummary,
} from "./queue-admin.js";
export {
  ADMIN_QUEUE_NAMES,
  getAdminQueueCounts,
  getAdminQueueLabel,
  inspectAdminQueueJob,
  listAdminQueues,
  pauseAdminQueue,
  removeAdminQueueJob,
  resumeAdminQueue,
  retryAdminQueueJob,
} from "./queue-admin.js";
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
  FILE_CLEANUP_REPEAT,
  FILE_CLEANUP_SCHEDULER_ID,
} from "./queue-settings.js";
export type {
  WorkerHeartbeat,
  WorkerHeartbeatStatus,
  WorkerHeartbeatView,
} from "./worker-heartbeat.js";
export {
  createWorkerHeartbeatState,
  listWorkerHeartbeats,
  parseWorkerHeartbeat,
  resolveWorkerHeartbeatStatus,
  startWorkerHeartbeat,
  WORKER_HEARTBEAT_INTERVAL_MS,
  WORKER_HEARTBEAT_KEY_PREFIX,
  WORKER_HEARTBEAT_TTL_SECONDS,
  writeWorkerHeartbeat,
} from "./worker-heartbeat.js";
