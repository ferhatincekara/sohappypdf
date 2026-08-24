"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function EditorPageNav({
  currentPage,
  pageCount,
  disabled,
  onPage,
}: {
  currentPage: number;
  pageCount: number;
  disabled: boolean;
  onPage: (page: number) => void;
}) {
  const t = useTranslations("publicTools.editor");

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        disabled={disabled || currentPage <= 1}
        aria-label={t("previousPage")}
        onClick={() => {
          onPage(currentPage - 1);
        }}
      >
        <ChevronLeftIcon />
      </Button>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {t("pageOf", { current: currentPage, total: pageCount })}
      </p>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        disabled={disabled || currentPage >= pageCount}
        aria-label={t("nextPage")}
        onClick={() => {
          onPage(currentPage + 1);
        }}
      >
        <ChevronRightIcon />
      </Button>
    </div>
  );
}
