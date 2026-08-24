"use client";

import { useTranslations } from "next-intl";
import { formatLabel } from "../../lib/format-labels";

export function ConvertResultSummary({
  sourceFormat,
  targetFormat,
}: {
  sourceFormat: string;
  targetFormat: string;
}) {
  const t = useTranslations("publicTools.workspaces.convert");
  const source = formatLabel(sourceFormat);
  const target = formatLabel(targetFormat);

  return (
    <section
      className="flex flex-col gap-3"
      aria-labelledby="convert-result-heading"
    >
      <h2
        id="convert-result-heading"
        className="text-base font-semibold tracking-tight text-foreground"
      >
        {t("resultTitle")}
      </h2>
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-medium text-foreground">
          {t("equation", { source, target })}
        </p>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          {t("resultHint", { source, target })}
        </p>
      </div>
    </section>
  );
}
