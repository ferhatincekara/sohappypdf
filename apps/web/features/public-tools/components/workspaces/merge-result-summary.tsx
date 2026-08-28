"use client";

import { useTranslations } from "next-intl";

export function MergeResultSummary({
  fileCount,
  pageCount,
  fileNames,
}: {
  fileCount: number;
  pageCount: number;
  fileNames: readonly string[];
}) {
  const t = useTranslations("publicTools.workspaces.merge");
  const equation = fileNames.join(" + ");

  return (
    <section
      className="flex flex-col gap-3"
      aria-labelledby="merge-result-heading"
    >
      <h2
        id="merge-result-heading"
        className="text-base font-semibold tracking-tight text-foreground"
      >
        {t("resultTitle")}
      </h2>
      <div>
        <p className="text-sm font-semibold text-foreground">
          {t("resultLabel")}
        </p>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          {fileCount < 2
            ? t("selectPrompt")
            : t("equation", { files: equation })}
        </p>
      </div>
      {fileCount < 2 ? null : (
        <p className="text-sm font-medium text-foreground" aria-live="polite">
          {pageCount > 0
            ? t("outputWithPages", { files: fileCount, pages: pageCount })
            : t("output", { count: fileCount })}
        </p>
      )}
    </section>
  );
}
