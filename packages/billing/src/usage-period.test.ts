import { describe, expect, test } from "bun:test";
import {
  addUtcMonths,
  getUtcDayPeriod,
  getUtcMonthPeriod,
  resolveAnchoredMonthPeriod,
} from "./usage-period.js";

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

describe("addUtcMonths", () => {
  test("keeps the payment day across months", () => {
    expect(
      addUtcMonths(new Date("2026-08-27T14:00:00.000Z"), 1).toISOString(),
    ).toBe("2026-09-27T14:00:00.000Z");
  });

  test("clamps to the last day of shorter months", () => {
    expect(
      addUtcMonths(new Date("2026-01-31T12:00:00.000Z"), 1).toISOString(),
    ).toBe("2026-02-28T12:00:00.000Z");
  });
});

describe("resolveAnchoredMonthPeriod", () => {
  test("starts the month on the payment day, not the first", () => {
    const period = resolveAnchoredMonthPeriod({
      anchorStart: new Date("2026-08-27T14:00:00.000Z"),
      now: new Date("2026-08-27T17:00:00.000Z"),
    });

    expect(period.start.toISOString()).toBe("2026-08-27T14:00:00.000Z");
    expect(period.end.toISOString()).toBe("2026-09-27T14:00:00.000Z");
  });
});

describe("getUtcDayPeriod", () => {
  test("uses a deterministic UTC calendar day", () => {
    const period = getUtcDayPeriod(new Date("2026-08-24T23:30:00.000Z"));

    expect(period.start.toISOString()).toBe("2026-08-24T00:00:00.000Z");
    expect(period.end.toISOString()).toBe("2026-08-25T00:00:00.000Z");
  });
});
