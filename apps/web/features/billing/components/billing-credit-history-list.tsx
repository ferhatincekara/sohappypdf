"use client";

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  API_CREDIT_HISTORY_PREVIEW_COUNT,
  apiHistoryMotion,
  summarizeApiCreditHistory,
} from "../lib/summarize-api-credit-history";
import type { ApiCreditLedgerEntry } from "../types/billing";
import { billingTileClassName } from "./billing-plan-hero";

export function BillingCreditHistoryList({
  entries,
}: {
  entries: readonly ApiCreditLedgerEntry[];
}) {
  const t = useTranslations("billing.api");
  const tTools = useTranslations("tools");
  const formatter = useFormatter();
  const rows = summarizeApiCreditHistory(entries);
  const [expanded, setExpanded] = useState(false);
  const visibleRows = expanded
    ? rows
    : rows.slice(0, API_CREDIT_HISTORY_PREVIEW_COUNT);

  if (rows.length === 0) {
    return (
      <p
        className={cn(
          billingTileClassName,
          "px-4 py-5 text-sm text-muted-foreground",
        )}
      >
        {t("noUsage")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {visibleRows.map((row) => {
          const toolLabel =
            row.toolId === null
              ? t(`history.${row.kind}`)
              : tTools(`${row.toolId}.name`);

          return (
            <li
              key={row.id}
              className={cn(
                billingTileClassName,
                "flex flex-col gap-1 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
              )}
            >
              <div className="min-w-0">
                <p className="truncate text-base font-semibold tracking-tight text-foreground">
                  {toolLabel}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatter.dateTime(new Date(row.createdAt), {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {t(`ledger.${apiHistoryMotion(row.kind)}`, {
                  amount: row.amount,
                })}
              </p>
            </li>
          );
        })}
      </ul>
      {rows.length > API_CREDIT_HISTORY_PREVIEW_COUNT ? (
        <Button
          type="button"
          variant="white"
          className="w-full"
          aria-expanded={expanded}
          onClick={() => {
            setExpanded((current) => !current);
          }}
        >
          {expanded ? t("showLess") : t("showMore")}
          {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </Button>
      ) : null}
    </div>
  );
}
