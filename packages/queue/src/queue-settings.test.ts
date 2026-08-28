import { describe, expect, test } from "bun:test";
import {
  CONVERSION_COMPLETED_JOB_RETENTION,
  CONVERSION_FAILED_JOB_RETENTION,
  CONVERSION_JOB_ATTEMPTS,
  CONVERSION_JOB_BACKOFF,
  CONVERSION_JOB_NAME,
  CONVERSION_QUEUE_NAME,
  CONVERSION_QUEUE_SETTINGS,
  FILE_CLEANUP_INTERVAL_MS,
  FILE_CLEANUP_JOB_NAME,
  FILE_CLEANUP_QUEUE_NAME,
  FILE_CLEANUP_REPEAT,
} from "./queue-settings.js";

describe("queue settings", () => {
  test("keeps a single conversion queue", () => {
    expect(CONVERSION_QUEUE_NAME).toBe("conversion");
    expect(CONVERSION_JOB_NAME).toBe("convert");
    expect(CONVERSION_QUEUE_SETTINGS.queueName).toBe("conversion");
  });

  test("limits retries with exponential backoff", () => {
    expect(CONVERSION_JOB_ATTEMPTS).toBe(5);
    expect(CONVERSION_JOB_ATTEMPTS).toBeLessThan(Number.POSITIVE_INFINITY);
    expect(CONVERSION_JOB_BACKOFF).toEqual({
      type: "exponential",
      delay: 2_000,
    });
  });

  test("retains failed jobs longer than completed jobs", () => {
    expect(CONVERSION_COMPLETED_JOB_RETENTION.count).toBe(200);
    expect(CONVERSION_COMPLETED_JOB_RETENTION.age).toBe(24 * 60 * 60);
    expect(CONVERSION_FAILED_JOB_RETENTION.count).toBe(1_000);
    expect(CONVERSION_FAILED_JOB_RETENTION.age).toBe(7 * 24 * 60 * 60);
    expect(CONVERSION_FAILED_JOB_RETENTION.age).toBeGreaterThan(
      CONVERSION_COMPLETED_JOB_RETENTION.age,
    );
  });

  test("schedules file cleanup on a separate queue", () => {
    expect(FILE_CLEANUP_QUEUE_NAME).toBe("file-cleanup");
    expect(FILE_CLEANUP_JOB_NAME).toBe("cleanup-expired");
    expect(FILE_CLEANUP_INTERVAL_MS).toBe(2 * 60 * 60 * 1000);
    expect(FILE_CLEANUP_REPEAT).toEqual({
      every: FILE_CLEANUP_INTERVAL_MS,
      immediately: true,
    });
  });
});
