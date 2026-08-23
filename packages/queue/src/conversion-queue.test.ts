import { describe, expect, test } from "bun:test";
import type { ConversionJobData } from "./conversion-job.js";
import {
  type ConversionJobWriter,
  createConversionEnqueue,
} from "./conversion-queue.js";
import { CONVERSION_JOB_NAME } from "./queue-settings.js";

const input: ConversionJobData = {
  conversionId: "550e8400-e29b-41d4-a716-446655440010",
  sourceFileId: "550e8400-e29b-41d4-a716-446655440011",
  sourceObjectKey: "files/550e8400-e29b-41d4-a716-446655440011/original",
  conversionType: "compress-pdf",
  sourceFormat: "pdf",
  targetFormat: "pdf",
  options: { level: "medium" },
};

describe("conversion enqueue", () => {
  test("adds one convert job keyed by conversion ID without connecting to Redis", async () => {
    const added: Array<{
      name: string;
      data: ConversionJobData;
      jobId: string;
    }> = [];
    const writer: ConversionJobWriter = {
      async add(name, data, opts) {
        added.push({ name, data, jobId: opts.jobId });
      },
    };

    const enqueue = createConversionEnqueue(writer);
    const result = await enqueue(input);

    expect(result).toEqual({
      jobId: input.conversionId,
      conversionId: input.conversionId,
    });
    expect(added).toEqual([
      {
        name: CONVERSION_JOB_NAME,
        data: input,
        jobId: input.conversionId,
      },
    ]);
  });
});
