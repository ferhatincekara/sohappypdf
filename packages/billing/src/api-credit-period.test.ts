import { describe, expect, test } from "bun:test";
import { resolveApiCreditPeriod } from "./api-credit-period.js";

describe("resolveApiCreditPeriod", () => {
  test("follows the Polar billing cycle instead of the calendar month", () => {
    const period = resolveApiCreditPeriod({
      now: new Date("2026-08-27T17:00:00.000Z"),
      subscription: {
        status: "active",
        endedAt: null,
        cancelAtPeriodEnd: false,
        currentPeriodStart: new Date("2026-08-27T14:00:00.000Z"),
        currentPeriodEnd: new Date("2026-09-27T14:00:00.000Z"),
      },
    });

    expect(period.start.toISOString()).toBe("2026-08-27T14:00:00.000Z");
    expect(period.end.toISOString()).toBe("2026-09-27T14:00:00.000Z");
  });

  test("slices a yearly Polar period into months from the payment day", () => {
    const period = resolveApiCreditPeriod({
      now: new Date("2026-10-01T12:00:00.000Z"),
      subscription: {
        status: "active",
        endedAt: null,
        cancelAtPeriodEnd: false,
        currentPeriodStart: new Date("2026-08-27T14:00:00.000Z"),
        currentPeriodEnd: new Date("2027-08-27T14:00:00.000Z"),
      },
    });

    expect(period.start.toISOString()).toBe("2026-09-27T14:00:00.000Z");
    expect(period.end.toISOString()).toBe("2026-10-27T14:00:00.000Z");
  });

  test("falls back to the UTC calendar month without an API pack", () => {
    const period = resolveApiCreditPeriod({
      now: new Date("2026-08-27T17:00:00.000Z"),
      subscription: null,
    });

    expect(period.start.toISOString()).toBe("2026-08-01T00:00:00.000Z");
    expect(period.end.toISOString()).toBe("2026-09-01T00:00:00.000Z");
  });
});
