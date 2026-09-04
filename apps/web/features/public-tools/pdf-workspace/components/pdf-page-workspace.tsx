"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import {
  PdfPageGrid,
  PdfPageGridSkeleton,
} from "@/features/public-tools/pdf-workspace/components/pdf-page-grid";
import { PdfPageSelectionToolbar } from "@/features/public-tools/pdf-workspace/components/pdf-page-selection-toolbar";
import type { PdfDocumentState } from "@/features/public-tools/pdf-workspace/hooks/use-pdf-document";
import { usePdfPageSelection } from "@/features/public-tools/pdf-workspace/hooks/use-pdf-page-selection";
import type { PageSelectionMode } from "@/features/public-tools/pdf-workspace/lib/page-selection";
import {
  createPdfPages,
  type PdfPage,
} from "@/features/public-tools/pdf-workspace/types/pdf-page";

export function PdfPageWorkspace({
  pdf,
  selectedPages,
  onSelectedPagesChange,
  disabled = false,
  mode = "multiple",
  passwordProtectedMessage,
  previewFailedMessage,
  renderPageOverlay,
  mapPages,
  toolbarChildren,
  showToolbar = true,
  children,
}: {
  pdf: PdfDocumentState;
  selectedPages: readonly number[];
  onSelectedPagesChange: (pages: number[]) => void;
  disabled?: boolean;
  mode?: PageSelectionMode;
  passwordProtectedMessage?: string;
  previewFailedMessage?: string;
  renderPageOverlay?: (page: PdfPage) => ReactNode;
  mapPages?: (pages: PdfPage[]) => PdfPage[];
  toolbarChildren?: ReactNode;
  showToolbar?: boolean;
  children?: ReactNode;
}) {
  const t = useTranslations("publicTools.pages");
  const selection = usePdfPageSelection({
    pageCount: pdf.pageCount,
    selectedPages,
    onSelectedPagesChange,
    mode,
  });

  if (pdf.status === "idle") {
    return null;
  }

  if (pdf.status === "loading") {
    return <PdfPageGridSkeleton />;
  }

  if (pdf.status === "error") {
    const message =
      pdf.errorKey === "passwordProtected"
        ? (passwordProtectedMessage ?? t("passwordProtected"))
        : (previewFailedMessage ?? t("previewFailed"));

    return (
      <p className="text-sm text-muted-foreground text-pretty">{message}</p>
    );
  }

  if (pdf.document === null) {
    return null;
  }

  const pages = (mapPages ?? ((value: PdfPage[]) => value))(
    createPdfPages(pdf.pageCount, selection.selectedPages),
  );

  return (
    <div className="flex flex-col gap-4">
      {showToolbar ? (
        <PdfPageSelectionToolbar
          selectedCount={selection.selectedCount}
          pageCount={pdf.pageCount}
          isAllSelected={selection.isAllSelected}
          disabled={disabled}
          onSelectAll={selection.selectAll}
          onClear={selection.clear}
        >
          {toolbarChildren}
        </PdfPageSelectionToolbar>
      ) : null}
      <PdfPageGrid
        document={pdf.document}
        pages={pages}
        disabled={disabled}
        renderPageOverlay={renderPageOverlay}
        onActivate={(page, modifiers) => {
          selection.activate(page.pageNumber, modifiers);
        }}
      />
      {children}
    </div>
  );
}
