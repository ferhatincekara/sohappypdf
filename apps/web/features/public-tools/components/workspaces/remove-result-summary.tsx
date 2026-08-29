"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function RemoveResultSummary({
  copy = "remove",
  selectedCount,
  remainingCount,
  wouldRemoveAll,
}: {
  copy?: "remove" | "extract";
  selectedCount: number;
  remainingCount: number;
  wouldRemoveAll: boolean;
}) {
  const t = useTranslations(`publicTools.workspaces.${copy}`);

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

      <div className={cn(wouldRemoveAll && "text-destructive")}>
        {selectedCount === 0 ? (
          <p className="text-sm text-muted-foreground text-pretty">
            {t("selectPrompt")}
          </p>
        ) : wouldRemoveAll ? (
          <p className="text-sm font-semibold" role="alert">
            {t("keepOnePage")}
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            <p
              className="text-sm font-semibold text-foreground"
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
