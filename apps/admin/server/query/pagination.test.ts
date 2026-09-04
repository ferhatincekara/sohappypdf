import { describe, expect, test } from "bun:test";
import { fillDailySeries } from "./date-range.ts";
import { paginated, parsePage, parsePageSize } from "./pagination.js";

describe("admin pagination", () => {
  test("rejects unbounded page sizes", () => {
    expect(parsePage("0")).toBe(1);
    expect(parsePage("3")).toBe(3);
    expect(parsePageSize("999")).toBe(50);
    expect(paginated(["a"], 51, 1, 25).pageCount).toBe(3);
  });
});

describe("fillDailySeries", () => {
  test("inserts zero days between sparse counts", () => {
    const filled = fillDailySeries(
      new Date("2026-09-01T10:00:00.000Z"),
      new Date("2026-09-03T10:00:00.000Z"),
      [{ day: "2026-09-01", total: 4 }],
      (day) => ({ day, total: 0 }),
    );

    expect(filled).toEqual([
      { day: "2026-09-01", total: 4 },
      { day: "2026-09-02", total: 0 },
      { day: "2026-09-03", total: 0 },
    ]);
  });
});
