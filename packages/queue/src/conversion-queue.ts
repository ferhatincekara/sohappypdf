import { Queue } from "bullmq";
import {
  type ConversionJobData,
  createConversionJob,
} from "./conversion-job.js";
import { getQueueConnection } from "./queue-connection.js";
import {
  CONVERSION_QUEUE_NAME,
  CONVERSION_QUEUE_SETTINGS,
} from "./queue-settings.js";

export type EnqueueConversionResult = {
  jobId: string;
  conversionId: string;
};

export type ConversionJobWriter = {
  add(
    name: string,
    data: ConversionJobData,
    opts: {
      jobId: string;
      attempts: number;
      backoff: { type: "exponential"; delay: number };
      removeOnComplete: { count: number; age: number };
      removeOnFail: { count: number; age: number };
    },
  ): Promise<unknown>;
};

let conversionQueue: Queue<ConversionJobData> | undefined;

function getConversionQueue(): Queue<ConversionJobData> {
  if (conversionQueue === undefined) {
    conversionQueue = new Queue<ConversionJobData>(CONVERSION_QUEUE_NAME, {
      connection: getQueueConnection("producer"),
      defaultJobOptions: {
        attempts: CONVERSION_QUEUE_SETTINGS.attempts,
        backoff: {
          type: CONVERSION_QUEUE_SETTINGS.backoff.type,
          delay: CONVERSION_QUEUE_SETTINGS.backoff.delay,
        },
        removeOnComplete: {
          count: CONVERSION_QUEUE_SETTINGS.removeOnComplete.count,
          age: CONVERSION_QUEUE_SETTINGS.removeOnComplete.age,
        },
        removeOnFail: {
          count: CONVERSION_QUEUE_SETTINGS.removeOnFail.count,
          age: CONVERSION_QUEUE_SETTINGS.removeOnFail.age,
        },
      },
    });
  }

  return conversionQueue;
}

export function createConversionEnqueue(
  writer: ConversionJobWriter,
): (input: ConversionJobData) => Promise<EnqueueConversionResult> {
  return async (input) => {
    const job = createConversionJob(input);
    await writer.add(job.name, job.data, job.opts);

    return {
      jobId: job.opts.jobId,
      conversionId: job.data.conversionId,
    };
  };
}

export async function enqueueConversion(
  input: ConversionJobData,
): Promise<EnqueueConversionResult> {
  return createConversionEnqueue(getConversionQueue())(input);
}
