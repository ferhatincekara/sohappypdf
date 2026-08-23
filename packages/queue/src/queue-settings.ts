export const CONVERSION_QUEUE_NAME = "conversion";
export const CONVERSION_JOB_NAME = "convert";

export const CONVERSION_JOB_ATTEMPTS = 5;
export const CONVERSION_JOB_BACKOFF_DELAY_MS = 2_000;

export const CONVERSION_COMPLETED_JOB_RETENTION = {
  count: 200,
  age: 24 * 60 * 60,
} as const;

export const CONVERSION_FAILED_JOB_RETENTION = {
  count: 1_000,
  age: 7 * 24 * 60 * 60,
} as const;

export const CONVERSION_JOB_BACKOFF = {
  type: "exponential",
  delay: CONVERSION_JOB_BACKOFF_DELAY_MS,
} as const;

export type ConversionQueueSettings = {
  queueName: typeof CONVERSION_QUEUE_NAME;
  jobName: typeof CONVERSION_JOB_NAME;
  attempts: typeof CONVERSION_JOB_ATTEMPTS;
  backoff: typeof CONVERSION_JOB_BACKOFF;
  removeOnComplete: typeof CONVERSION_COMPLETED_JOB_RETENTION;
  removeOnFail: typeof CONVERSION_FAILED_JOB_RETENTION;
};

export const CONVERSION_QUEUE_SETTINGS: ConversionQueueSettings = {
  queueName: CONVERSION_QUEUE_NAME,
  jobName: CONVERSION_JOB_NAME,
  attempts: CONVERSION_JOB_ATTEMPTS,
  backoff: CONVERSION_JOB_BACKOFF,
  removeOnComplete: CONVERSION_COMPLETED_JOB_RETENTION,
  removeOnFail: CONVERSION_FAILED_JOB_RETENTION,
};
