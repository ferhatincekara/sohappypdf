"use client";

import { useTranslations } from "next-intl";
import type { KeepSelectedPagesCopy } from "./keep-selected-pages-workspace";

export function SplitResultSummary({
  copy = "split",
  selectedCount,
  pageCount,
  isAllSelected,
}: {
  copy?: KeepSelectedPagesCopy;
  selectedCount: number;
  pageCount: number;
  isAllSelected: boolean;
}) {
  const t = useTranslations(`publicTools.workspaces.${copy}`);

  return (
    <section
      className="flex flex-col gap-3"
      aria-labelledby="split-result-heading"
    >
      <div className="flex flex-col gap-1">
        <h2
          id="split-result-heading"
          className="text-base font-extrabold tracking-tight text-foreground"
        >
          {t("modeTitle")}
        </h2>
      </div>

      <div>
        <p className="text-sm font-semibold text-foreground">
          {t("modeExtract")}
        </p>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          {t("modeExtractHint")}
        </p>
      </div>

      {selectedCount === 0 ? (
        <p className="text-sm text-muted-foreground text-pretty">
          {t("selectPrompt")}
        </p>
      ) : (
        <p className="text-sm font-medium text-foreground" aria-live="polite">
          {isAllSelected && pageCount > 0
            ? t("allSelectedOutput", { count: pageCount })
            : t("output", { count: selectedCount })}
        </p>
      )}
    </section>
  );
}
