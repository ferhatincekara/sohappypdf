import { describe, expect, test } from "bun:test";
import {
  CONVERSION_POLL_INTERVAL_MS,
  conversionListRefetchInterval,
  conversionRefetchInterval,
  isActiveConversionStatus,
} from "./conversion-polling";

describe("conversion polling", () => {
  test("polls only while the conversion is active", () => {
    expect(isActiveConversionStatus("queued")).toBe(true);
    expect(isActiveConversionStatus("processing")).toBe(true);
    expect(isActiveConversionStatus("pending")).toBe(true);
    expect(conversionRefetchInterval("queued")).toBe(
      CONVERSION_POLL_INTERVAL_MS,
    );
  });

  test("stops polling on completed and failed", () => {
    expect(isActiveConversionStatus("completed")).toBe(false);
    expect(isActiveConversionStatus("failed")).toBe(false);
    expect(isActiveConversionStatus("cancelled")).toBe(false);
    expect(conversionRefetchInterval("completed")).toBe(false);
    expect(conversionRefetchInterval("failed")).toBe(false);
    expect(conversionRefetchInterval(undefined)).toBe(false);
  });

  test("polls a history page only when it contains an active conversion", () => {
    expect(conversionListRefetchInterval(["completed", "failed"])).toBe(false);
    expect(conversionListRefetchInterval(["completed", "queued"])).toBe(
      CONVERSION_POLL_INTERVAL_MS,
    );
  });
});
