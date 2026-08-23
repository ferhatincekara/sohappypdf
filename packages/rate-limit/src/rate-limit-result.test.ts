import { describe, expect, test } from "bun:test";
import { getRetryAfterSeconds } from "./rate-limit-result.js";

describe("getRetryAfterSeconds", () => {
  test("calculates Retry-After from the limiter reset timestamp", () => {
    expect(getRetryAfterSeconds(1_700_000_010_000, 1_700_000_000_400)).toBe(10);
  });

  test("does not invent a reset time", () => {
    expect(getRetryAfterSeconds(0, Date.now())).toBeUndefined();
    expect(getRetryAfterSeconds(Number.NaN, Date.now())).toBeUndefined();
  });
});
