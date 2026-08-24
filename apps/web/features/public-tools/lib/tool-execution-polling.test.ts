import { describe, expect, test } from "bun:test";
import { CONVERSION_POLL_INTERVAL_MS } from "@/features/conversions/lib/conversion-polling";
import { toolExecutionRefetchInterval } from "./tool-execution-polling";

describe("tool execution polling", () => {
  const now = new Date("2026-08-24T01:00:00.000Z");

  test("polls only while an execution is active", () => {
    expect(
      toolExecutionRefetchInterval(
        {
          status: "queued",
          expired: false,
          expiresAt: "2026-08-24T02:00:00.000Z",
        },
        now,
      ),
    ).toBe(CONVERSION_POLL_INTERVAL_MS);
    expect(
      toolExecutionRefetchInterval(
        {
          status: "processing",
          expired: false,
          expiresAt: null,
        },
        now,
      ),
    ).toBe(CONVERSION_POLL_INTERVAL_MS);
  });

  test("stops polling on completion, failure, and expiration", () => {
    expect(
      toolExecutionRefetchInterval(
        {
          status: "completed",
          expired: false,
          expiresAt: "2026-08-24T02:00:00.000Z",
        },
        now,
      ),
    ).toBe(false);
    expect(
      toolExecutionRefetchInterval({
        status: "failed",
        expired: false,
        expiresAt: null,
      }),
    ).toBe(false);
    expect(
      toolExecutionRefetchInterval({
        status: "completed",
        expired: true,
        expiresAt: "2026-08-24T00:00:00.000Z",
      }),
    ).toBe(false);
    expect(toolExecutionRefetchInterval(undefined)).toBe(false);
  });
});
