import { describe, expect, test } from "bun:test";
import {
  CONVERSION_COMPLETED_JOB_RETENTION,
  CONVERSION_FAILED_JOB_RETENTION,
  CONVERSION_JOB_ATTEMPTS,
  CONVERSION_JOB_BACKOFF,
  CONVERSION_JOB_NAME,
  CONVERSION_QUEUE_NAME,
  CONVERSION_QUEUE_SETTINGS,
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
});
