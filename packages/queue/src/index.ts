import { assertServerOnly } from "@repo/core";

assertServerOnly("@repo/queue");

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
} from "./queue-settings.js";
