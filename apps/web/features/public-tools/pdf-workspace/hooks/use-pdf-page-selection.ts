"use client";

import { useState } from "react";
import {
  allPages,
  applyPageActivation,
  isAllPagesSelected,
  type PageActivationModifiers,
  type PageSelectionMode,
} from "@/features/public-tools/pdf-workspace/lib/page-selection";

export function usePdfPageSelection({
  pageCount,
  selectedPages,
  onSelectedPagesChange,
  mode = "multiple",
}: {
  pageCount: number;
  selectedPages: readonly number[];
  onSelectedPagesChange: (pages: number[]) => void;
  mode?: PageSelectionMode;
}) {
  const [anchor, setAnchor] = useState<number | null>(null);
  const selectedCount = selectedPages.length;

  function activate(
    pageNumber: number,
    modifiers: PageActivationModifiers,
  ): void {
    const next = applyPageActivation({
      selectedPages,
      pageNumber,
      pageCount,
      anchor,
      mode,
      modifiers,
    });
    setAnchor(next.anchor);
    onSelectedPagesChange(next.selectedPages);
  }

  function selectAll(): void {
    const pages = allPages(pageCount);
    setAnchor(pages[0] ?? null);
    onSelectedPagesChange(pages);
  }

  function clear(): void {
    setAnchor(null);
    onSelectedPagesChange([]);
  }

  return {
    selectedPages,
    selectedCount,
    isAllSelected: isAllPagesSelected(selectedPages, pageCount),
    activate,
    selectAll,
    clear,
  };
}
