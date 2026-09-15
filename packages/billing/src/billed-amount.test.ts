import { describe, expect, test } from "bun:test";
import {
  monthlyCentsFromBilledAmount,
  monthlyUsdFromBilledAmount,
  usesMonthlyWebCredits,
} from "./billed-amount.js";

describe("billed amount", () => {
  test("treats missing, zero, and complimentary amounts as no MRR", () => {
    expect(
      monthlyUsdFromBilledAmount({
        amountCents: null,
        recurringInterval: "month",
      }),
    ).toBe(0);
    expect(
      monthlyUsdFromBilledAmount({
        amountCents: 0,
        recurringInterval: "month",
      }),
    ).toBe(0);
    expect(usesMonthlyWebCredits(0)).toBe(false);
  });

  test("converts Polar billed cents into monthly USD", () => {
    expect(
      monthlyUsdFromBilledAmount({
        amountCents: 500,
        recurringInterval: "month",
      }),
    ).toBe(5);
    expect(
      monthlyCentsFromBilledAmount({
        amountCents: 10_800,
        recurringInterval: "year",
      }),
    ).toBe(900);
  });
});
