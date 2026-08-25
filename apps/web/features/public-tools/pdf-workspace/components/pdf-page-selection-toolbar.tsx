"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function PdfPageSelectionToolbar({
  selectedCount,
  pageCount,
  isAllSelected,
  disabled,
  onSelectAll,
  onClear,
  children,
}: {
  selectedCount: number;
  pageCount: number;
  isAllSelected: boolean;
  disabled: boolean;
  onSelectAll: () => void;
  onClear: () => void;
  children?: ReactNode;
}) {
  const t = useTranslations("publicTools.pages");
  const selectionLabel =
    isAllSelected && pageCount > 0
      ? t("allSelected", { count: pageCount })
      : t("selectedCount", { count: selectedCount });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="min-h-11 min-w-11"
        disabled={disabled || pageCount < 1}
        onClick={onSelectAll}
      >
        {t("selectAll")}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="min-h-11 min-w-11"
        disabled={disabled || selectedCount === 0}
        onClick={onClear}
      >
        {t("clear")}
      </Button>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {selectionLabel}
      </p>
      {children}
    </div>
  );
}
