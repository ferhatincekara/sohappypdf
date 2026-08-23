import { describe, expect, test } from "bun:test";
import { isAppError } from "@repo/core";
import {
  assertConversionStatusTransition,
  canTransitionConversionStatus,
  isConversionStatus,
} from "./conversion-status.js";

describe("conversion status", () => {
  test("accepts the defined lifecycle values", () => {
    expect(isConversionStatus("pending")).toBe(true);
    expect(isConversionStatus("queued")).toBe(true);
    expect(isConversionStatus("processing")).toBe(true);
    expect(isConversionStatus("archived")).toBe(false);
  });

  test("allows the asynchronous execution transitions", () => {
    expect(canTransitionConversionStatus("pending", "queued")).toBe(true);
    expect(canTransitionConversionStatus("queued", "processing")).toBe(true);
    expect(canTransitionConversionStatus("processing", "completed")).toBe(true);
    expect(canTransitionConversionStatus("processing", "failed")).toBe(true);
    expect(canTransitionConversionStatus("queued", "failed")).toBe(true);
    expect(canTransitionConversionStatus("pending", "failed")).toBe(true);
    expect(canTransitionConversionStatus("pending", "cancelled")).toBe(true);
    expect(canTransitionConversionStatus("queued", "cancelled")).toBe(true);
  });

  test("rejects illegal transitions", () => {
    expect(canTransitionConversionStatus("pending", "completed")).toBe(false);
    expect(canTransitionConversionStatus("pending", "processing")).toBe(false);
    expect(canTransitionConversionStatus("processing", "cancelled")).toBe(
      false,
    );
    expect(canTransitionConversionStatus("completed", "failed")).toBe(false);
    expect(canTransitionConversionStatus("failed", "queued")).toBe(false);

    try {
      assertConversionStatusTransition("completed", "processing");
      throw new Error("expected transition to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("CONFLICT");
      }
    }
  });
});
