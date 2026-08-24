"use client";

import { useTranslations } from "next-intl";
import { type KeyboardEvent, type ReactNode, useRef } from "react";
import type { PdfjsDocument } from "../../lib/pdfjs-client";
import {
  type PageActivationModifiers,
  pageActivationFromPointerEvent,
} from "../lib/page-selection";
import type { PdfPage } from "../types/pdf-page";
import { PdfPageThumbnail } from "./pdf-page-thumbnail";

export const PDF_PAGE_GRID_CLASS_NAME =
  "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

export function PdfPageGrid({
  document,
  pages,
  disabled,
  renderPageOverlay,
  onActivate,
}: {
  document: PdfjsDocument;
  pages: readonly PdfPage[];
  disabled: boolean;
  renderPageOverlay?: (page: PdfPage) => ReactNode;
  onActivate: (pageNumber: number, modifiers: PageActivationModifiers) => void;
}) {
  const t = useTranslations("publicTools.pages");
  const listRef = useRef<HTMLUListElement>(null);

  function focusPageAt(index: number): void {
    const page = pages[index];

    if (page === undefined) {
      return;
    }

    const target = listRef.current?.querySelector(
      `[data-pdf-page="${page.pageNumber}"]`,
    );

    if (target instanceof HTMLButtonElement) {
      target.focus();
    }
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    pageNumber: number,
  ): void {
    const index = pages.findIndex((page) => page.pageNumber === pageNumber);

    if (index < 0) {
      return;
    }

    const lastIndex = pages.length - 1;
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = Math.min(index + 1, lastIndex);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = Math.max(index - 1, 0);
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = lastIndex;
    }

    if (nextIndex === null || nextIndex === index) {
      return;
    }

    event.preventDefault();
    focusPageAt(nextIndex);
  }

  return (
    <ul
      ref={listRef}
      className={PDF_PAGE_GRID_CLASS_NAME}
      aria-label={t("gridLabel")}
    >
      {pages.map((page) => (
        <li key={page.pageIndex}>
          <PdfPageThumbnail
            document={document}
            pageNumber={page.pageNumber}
            selected={page.selected}
            disabled={disabled}
            overlay={renderPageOverlay?.(page)}
            onActivate={(event) => {
              onActivate(
                page.pageNumber,
                pageActivationFromPointerEvent(event),
              );
            }}
            onKeyDown={(event) => {
              handleKeyDown(event, page.pageNumber);
            }}
          />
        </li>
      ))}
    </ul>
  );
}

const SKELETON_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export function PdfPageGridSkeleton() {
  const t = useTranslations("publicTools.pages");

  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{t("loading")}</span>
      <ul className={PDF_PAGE_GRID_CLASS_NAME} aria-hidden="true">
        {SKELETON_SLOTS.map((slot) => (
          <li key={slot}>
            <div className="flex flex-col items-center gap-2 rounded-xl p-2">
              <div className="aspect-[3/4] w-full animate-pulse rounded-lg border-2 border-border bg-muted" />
              <div className="h-3 w-6 animate-pulse rounded-sm bg-muted" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
