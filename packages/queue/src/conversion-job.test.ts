import { describe, expect, test } from "bun:test";
import { isAppError } from "@repo/core";
import {
  type ConversionJobData,
  createConversionJob,
  createConversionJobId,
  parseConversionJobData,
} from "./conversion-job.js";
import {
  CONVERSION_JOB_NAME,
  CONVERSION_QUEUE_NAME,
  CONVERSION_QUEUE_SETTINGS,
} from "./queue-settings.js";

const validJob: ConversionJobData = {
  conversionId: "550e8400-e29b-41d4-a716-446655440000",
  sourceFileId: "550e8400-e29b-41d4-a716-446655440001",
  sourceObjectKey: "files/550e8400-e29b-41d4-a716-446655440001/original",
  conversionType: "pdf-to-jpg",
  sourceFormat: "pdf",
  targetFormat: "jpg",
  options: { page: 1, quality: 80 },
};

function expectInvalidPayload(run: () => unknown): void {
  try {
    run();
    throw new Error("expected payload validation to fail");
  } catch (error) {
    expect(isAppError(error)).toBe(true);
    if (isAppError(error)) {
      expect(error.code).toBe("VALIDATION_ERROR");
    }
  }
}

describe("conversion job contract", () => {
  test("uses the conversion queue and convert job name", () => {
    const job = createConversionJob(validJob);

    expect(CONVERSION_QUEUE_NAME).toBe("conversion");
    expect(job.name).toBe(CONVERSION_JOB_NAME);
    expect(job.name).toBe("convert");
  });

  test("creates a deterministic job ID from the conversion identity", () => {
    expect(createConversionJobId(validJob.conversionId)).toBe(
      validJob.conversionId,
    );
    expect(createConversionJob(validJob).opts.jobId).toBe(
      validJob.conversionId,
    );
    expect(createConversionJob(validJob).opts.jobId).toBe(
      createConversionJob(validJob).opts.jobId,
    );
  });

  test("applies centralized retry and retention options", () => {
    const job = createConversionJob(validJob);

    expect(job.opts.attempts).toBe(CONVERSION_QUEUE_SETTINGS.attempts);
    expect(job.opts.backoff).toEqual(CONVERSION_QUEUE_SETTINGS.backoff);
    expect(job.opts.removeOnComplete).toEqual(
      CONVERSION_QUEUE_SETTINGS.removeOnComplete,
    );
    expect(job.opts.removeOnFail).toEqual(
      CONVERSION_QUEUE_SETTINGS.removeOnFail,
    );
    expect(job.opts.attempts).toBe(5);
    expect(job.opts.backoff.type).toBe("exponential");
  });

  test("accepts a typed conversion payload", () => {
    expect(parseConversionJobData(validJob)).toEqual(validJob);
  });

  test("rejects invalid or sensitive payloads", () => {
    expectInvalidPayload(() =>
      parseConversionJobData({ ...validJob, conversionId: "not-a-uuid" }),
    );
    expectInvalidPayload(() =>
      parseConversionJobData({
        ...validJob,
        sourceObjectKey: "https://example.invalid/file.pdf?token=secret",
      }),
    );
    expectInvalidPayload(() =>
      parseConversionJobData({
        ...validJob,
        options: { password: "secret" },
      }),
    );
    expectInvalidPayload(() =>
      parseConversionJobData({
        ...validJob,
        url: "https://example.invalid/download",
      }),
    );
    expectInvalidPayload(() => createConversionJobId("123"));
  });
});
