"use client";

import { useTranslations } from "next-intl";

export function OrganizeResultSummary({
  sourcePageCount,
  resultPageCount,
}: {
  sourcePageCount: number;
  resultPageCount: number;
}) {
  const t = useTranslations("publicTools.workspaces.organize");

  if (resultPageCount < 1) {
    return (
      <p className="text-sm text-muted-foreground text-pretty">
        {t("keepOnePage")}
      </p>
    );
  }

  return (
    <p className="text-sm font-medium text-foreground" aria-live="polite">
      {sourcePageCount === resultPageCount
        ? t("outputSame", { count: resultPageCount })
        : t("output", {
            from: sourcePageCount,
            to: resultPageCount,
          })}
    </p>
  );
}
