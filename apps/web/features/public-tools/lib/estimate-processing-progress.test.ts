import { describe, expect, test } from "bun:test";
import { estimateProcessingPercent } from "./estimate-processing-progress";

describe("estimateProcessingPercent", () => {
  test("keeps queued jobs in a low band instead of looking finished", () => {
    expect(estimateProcessingPercent("queued", 0)).toBe(8);
    expect(estimateProcessingPercent("queued", 60_000)).toBe(32);
  });

  test("only climbs toward completion after processing has started", () => {
    expect(estimateProcessingPercent("processing", 0)).toBe(32);
    expect(estimateProcessingPercent("processing", 60_000)).toBe(94);
    expect(estimateProcessingPercent("processing", 60_000)).toBeLessThan(100);
  });

  test("moves forward as time elapses", () => {
    expect(estimateProcessingPercent("queued", 2_000)).toBeGreaterThan(
      estimateProcessingPercent("queued", 0),
    );
    expect(estimateProcessingPercent("processing", 4_000)).toBeGreaterThan(
      estimateProcessingPercent("processing", 400),
    );
  });
});
