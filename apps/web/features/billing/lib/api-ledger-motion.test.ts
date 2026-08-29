import { describe, expect, test } from "bun:test";
import { apiLedgerMotion } from "@/features/billing/lib/api-ledger-motion";

describe("apiLedgerMotion", () => {
  test("shows pack top-ups and grants as credits added", () => {
    expect(apiLedgerMotion({ type: "grant" })).toBe("grant");
    expect(apiLedgerMotion({ type: "adjustment" })).toBe("grant");
  });

  test("shows usage and refunds as they happened", () => {
    expect(apiLedgerMotion({ type: "consume" })).toBe("consume");
    expect(apiLedgerMotion({ type: "refund" })).toBe("refund");
  });
});
