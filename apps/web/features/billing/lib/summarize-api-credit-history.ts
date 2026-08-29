import type { ApiLedgerMotion } from "@/features/billing/lib/api-ledger-motion";
import type { ApiCreditLedgerEntry } from "@/features/billing/types/billing";

export type ApiCreditHistoryKind =
  | "reset"
  | "pack"
  | "grant"
  | "consume"
  | "refund";

const CREDIT_ADD_KINDS = new Set<ApiCreditHistoryKind>([
  "reset",
  "pack",
  "grant",
]);
const GROUP_WINDOW_MS = 60_000;
export const API_CREDIT_HISTORY_PREVIEW_COUNT = 6;

export type ApiCreditHistoryRow = {
  id: string;
  kind: ApiCreditHistoryKind;
  amount: number;
  toolId: string | null;
  createdAt: string;
};

export function summarizeApiCreditHistory(
  entries: readonly ApiCreditLedgerEntry[],
): readonly ApiCreditHistoryRow[] {
  const rows: ApiCreditHistoryRow[] = [];
  let index = 0;

  while (index < entries.length) {
    const entry = entries[index];
    if (entry === undefined) {
      break;
    }

    const kind = historyKind(entry);
    if (!CREDIT_ADD_KINDS.has(kind)) {
      rows.push({
        id: entry.id,
        kind,
        amount: entry.amount,
        toolId: entry.toolId,
        createdAt: entry.createdAt,
      });
      index += 1;
      continue;
    }

    let amount = entry.amount;
    let groupedKind: ApiCreditHistoryKind = kind;
    let cursor = index + 1;

    while (cursor < entries.length) {
      const next = entries[cursor];
      if (next === undefined) {
        break;
      }

      const nextKind = historyKind(next);
      if (!CREDIT_ADD_KINDS.has(nextKind)) {
        break;
      }

      if (!sameWindow(entry.createdAt, next.createdAt)) {
        break;
      }

      amount += next.amount;
      groupedKind = preferCreditAddKind(groupedKind, nextKind);
      cursor += 1;
    }

    rows.push({
      id: entry.id,
      kind: groupedKind,
      amount,
      toolId: null,
      createdAt: entry.createdAt,
    });
    index = cursor;
  }

  return rows;
}

export function apiHistoryMotion(kind: ApiCreditHistoryKind): ApiLedgerMotion {
  if (kind === "consume") {
    return "consume";
  }

  if (kind === "refund") {
    return "refund";
  }

  return "grant";
}

function historyKind(entry: ApiCreditLedgerEntry): ApiCreditHistoryKind {
  if (entry.kind !== undefined) {
    return entry.kind;
  }

  if (entry.type === "consume") {
    return "consume";
  }

  if (entry.type === "refund") {
    return "refund";
  }

  return "grant";
}

function preferCreditAddKind(
  current: ApiCreditHistoryKind,
  next: ApiCreditHistoryKind,
): ApiCreditHistoryKind {
  if (current === "reset" || next === "reset") {
    return "reset";
  }

  if (current === "pack" || next === "pack") {
    return "pack";
  }

  return "grant";
}

function sameWindow(left: string, right: string): boolean {
  return (
    Math.abs(new Date(left).getTime() - new Date(right).getTime()) <
    GROUP_WINDOW_MS
  );
}
