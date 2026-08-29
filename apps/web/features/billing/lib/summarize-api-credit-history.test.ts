import { describe, expect, test } from "bun:test";
import { summarizeApiCreditHistory } from "@/features/billing/lib/summarize-api-credit-history";
import type { ApiCreditLedgerEntry } from "@/features/billing/types/billing";

function entry(
  overrides: Partial<ApiCreditLedgerEntry> & Pick<ApiCreditLedgerEntry, "id">,
): ApiCreditLedgerEntry {
  return {
    amount: 100,
    type: "grant",
    kind: "grant",
    toolId: null,
    createdAt: "2026-08-28T06:21:00.000Z",
    ...overrides,
  };
}

describe("summarizeApiCreditHistory", () => {
  test("merges the same-minute included grant and pack top-ups into one reset", () => {
    const rows = summarizeApiCreditHistory([
      entry({ id: "a", amount: 100, type: "grant", kind: "reset" }),
      entry({
        id: "b",
        amount: 1000,
        type: "adjustment",
        kind: "pack",
        createdAt: "2026-08-28T06:21:04.000Z",
      }),
      entry({
        id: "c",
        amount: 900,
        type: "adjustment",
        kind: "pack",
        createdAt: "2026-08-28T06:21:08.000Z",
      }),
    ]);

    expect(rows).toEqual([
      {
        id: "a",
        kind: "reset",
        amount: 2000,
        toolId: null,
        createdAt: "2026-08-28T06:21:00.000Z",
      },
    ]);
  });

  test("keeps usage rows separate from credit grants", () => {
    const rows = summarizeApiCreditHistory([
      entry({
        id: "use",
        amount: 5,
        type: "consume",
        kind: "consume",
        toolId: "pdf-to-word",
        createdAt: "2026-08-28T07:00:00.000Z",
      }),
      entry({
        id: "grant",
        amount: 100,
        type: "grant",
        kind: "reset",
        createdAt: "2026-08-01T00:00:00.000Z",
      }),
    ]);

    expect(rows.map((row) => row.kind)).toEqual(["consume", "reset"]);
    expect(rows[0]?.toolId).toBe("pdf-to-word");
  });
});
