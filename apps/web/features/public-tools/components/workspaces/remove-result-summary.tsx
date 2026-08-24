"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function RemoveResultSummary({
  selectedCount,
  remainingCount,
  wouldRemoveAll,
}: {
  selectedCount: number;
  remainingCount: number;
  wouldRemoveAll: boolean;
}) {
  const t = useTranslations("publicTools.workspaces.remove");

  return (
    <section
      className="flex flex-col gap-3"
      aria-labelledby="remove-result-heading"
    >
      <h2
        id="remove-result-heading"
        className="text-base font-semibold tracking-tight text-foreground"
      >
        {t("resultTitle")}
      </h2>

      <div
        className={cn(
          "rounded-xl border p-4",
          wouldRemoveAll
            ? "border-destructive/40 bg-destructive/5"
            : "border-border bg-card",
        )}
      >
        {selectedCount === 0 ? (
          <p className="text-sm text-muted-foreground text-pretty">
            {t("selectPrompt")}
          </p>
        ) : wouldRemoveAll ? (
          <p className="text-sm font-medium text-destructive" role="alert">
            {t("keepOnePage")}
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            <p
              className="text-sm font-medium text-foreground"
              aria-live="polite"
            >
              {t("output", { count: selectedCount })}
            </p>
            <p className="text-sm text-muted-foreground text-pretty">
              {t("remaining", { count: remainingCount })}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
