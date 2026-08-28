export const API_LEDGER_KINDS = [
  "reset",
  "pack",
  "grant",
  "consume",
  "refund",
] as const;

export type ApiLedgerKind = (typeof API_LEDGER_KINDS)[number];

export function resolveApiLedgerKind(entry: {
  type: "grant" | "consume" | "refund" | "adjustment";
  reason: string;
}): ApiLedgerKind {
  if (entry.type === "consume") {
    return "consume";
  }

  if (entry.type === "refund") {
    return "refund";
  }

  if (entry.reason === "monthly_plan_grant") {
    return "reset";
  }

  if (entry.reason === "polar_topup") {
    return "pack";
  }

  return "grant";
}
