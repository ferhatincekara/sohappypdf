import { describe, expect, test } from "bun:test";
import { getUtcMonthPeriod } from "./usage-period.js";

describe("getUtcMonthPeriod", () => {
  test("uses a deterministic UTC calendar month", () => {
    const period = getUtcMonthPeriod(new Date("2026-08-24T23:30:00.000Z"));

    expect(period.start.toISOString()).toBe("2026-08-01T00:00:00.000Z");
    expect(period.end.toISOString()).toBe("2026-09-01T00:00:00.000Z");
  });

  test("does not follow a later local timezone offset", () => {
    const period = getUtcMonthPeriod(new Date("2026-07-31T23:00:00.000Z"));

    expect(period.start.toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(period.end.toISOString()).toBe("2026-08-01T00:00:00.000Z");
  });
});
