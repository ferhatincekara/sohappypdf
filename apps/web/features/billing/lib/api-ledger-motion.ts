import type { ApiCreditLedgerEntry } from "../types/billing";

export type ApiLedgerMotion = "grant" | "consume" | "refund";

export function apiLedgerMotion(
  entry: Pick<ApiCreditLedgerEntry, "type">,
): ApiLedgerMotion {
  if (entry.type === "consume") {
    return "consume";
  }

  if (entry.type === "refund") {
    return "refund";
  }

  return "grant";
}
