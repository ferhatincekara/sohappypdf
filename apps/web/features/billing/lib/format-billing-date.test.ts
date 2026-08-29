import { describe, expect, test } from "bun:test";
import { formatBillingDisplayDate } from "@/features/billing/lib/format-billing-date";

describe("formatBillingDisplayDate", () => {
  test("formats UTC calendar dates for the active locale", () => {
    expect(formatBillingDisplayDate("2026-08-24T00:00:00.000Z", "en")).toBe(
      "Aug 24, 2026",
    );
    expect(formatBillingDisplayDate("2026-09-24T00:00:00.000Z", "tr")).toBe(
      "24 Eyl 2026",
    );
  });
});
