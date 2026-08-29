"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { convertFormatLabel } from "@/features/public-tools/lib/format-labels";

export function ConvertFormatBar({
  sourceFormat,
  targetFormat,
  showFree,
}: {
  sourceFormat: string;
  targetFormat: string;
  showFree: boolean;
}) {
  const t = useTranslations("publicTools.workspaces.convert");
  const source = convertFormatLabel(sourceFormat);
  const target = convertFormatLabel(targetFormat);

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted px-5 py-4">
      <span className="font-medium text-foreground">
        {t("equation", { source, target })}
      </span>
      {showFree ? <Badge className="rounded-lg">{t("free")}</Badge> : null}
    </div>
  );
}
