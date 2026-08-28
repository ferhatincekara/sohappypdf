import { describe, expect, test } from "bun:test";
import { resolveApiLedgerKind } from "./api-ledger-kind";

describe("resolveApiLedgerKind", () => {
  test("labels the monthly included grant as a period reset", () => {
    expect(
      resolveApiLedgerKind({ type: "grant", reason: "monthly_plan_grant" }),
    ).toBe("reset");
  });

  test("labels Polar pack top-ups separately from generic grants", () => {
    expect(
      resolveApiLedgerKind({ type: "adjustment", reason: "polar_topup" }),
    ).toBe("pack");
  });

  test("keeps usage and refunds as they happened", () => {
    expect(
      resolveApiLedgerKind({ type: "consume", reason: "tool_execution" }),
    ).toBe("consume");
    expect(
      resolveApiLedgerKind({ type: "refund", reason: "execution_failed" }),
    ).toBe("refund");
  });
});
