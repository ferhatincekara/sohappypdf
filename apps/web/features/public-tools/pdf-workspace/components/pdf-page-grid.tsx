"use client";

import { useTranslations } from "next-intl";
import {
  type KeyboardEvent,
  type ReactNode,
  useId,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
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
  reorderable = false,
  renderPageOverlay,
  onActivate,
  onReorder,
}: {
  document: PdfjsDocument;
  pages: readonly PdfPage[];
  disabled: boolean;
  reorderable?: boolean;
  renderPageOverlay?: (page: PdfPage) => ReactNode;
  onActivate: (page: PdfPage, modifiers: PageActivationModifiers) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
}) {
  const t = useTranslations("publicTools.pages");
  const listRef = useRef<HTMLUListElement>(null);
  const keyboardHelpId = useId();
  const dragIndex = useRef<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  function focusPageAt(index: number): void {
    const page = pages[index];

    if (page === undefined) {
      return;
    }

    const target = listRef.current?.querySelector(
      `[data-pdf-page-id="${page.id}"]`,
    );

    if (target instanceof HTMLButtonElement) {
      target.focus();
    }
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    page: PdfPage,
  ): void {
    const index = pages.findIndex((item) => item.id === page.id);

    if (index < 0) {
      return;
    }

    if (
      reorderable &&
      onReorder !== undefined &&
      event.altKey &&
      (event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown")
    ) {
      const toIndex =
        event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? index - 1
          : index + 1;

      if (toIndex < 0 || toIndex >= pages.length) {
        return;
      }

      event.preventDefault();
      onReorder(index, toIndex);
      requestAnimationFrame(() => {
        focusPageAt(toIndex);
      });
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

  function clearDragState(): void {
    dragIndex.current = null;
    setDraggingIndex(null);
    setDropIndex(null);
  }

  return (
    <div>
      {reorderable ? (
        <p id={keyboardHelpId} className="sr-only">
          {t("keyboardHelp")}
        </p>
      ) : null}
      <ul
        ref={listRef}
        className={PDF_PAGE_GRID_CLASS_NAME}
        aria-label={t("gridLabel")}
        aria-describedby={reorderable ? keyboardHelpId : undefined}
      >
        {pages.map((page, index) => (
          <li
            key={page.id}
            onDragOver={(event) => {
              if (!reorderable || disabled || dragIndex.current === null) {
                return;
              }

              event.preventDefault();
              event.dataTransfer.dropEffect = "move";

              if (dropIndex !== index) {
                setDropIndex(index);
              }
            }}
            onDrop={(event) => {
              event.preventDefault();

              if (
                !reorderable ||
                disabled ||
                onReorder === undefined ||
                dragIndex.current === null ||
                dragIndex.current === index
              ) {
                clearDragState();
                return;
              }

              onReorder(dragIndex.current, index);
              clearDragState();
            }}
            className={cn(
              dropIndex === index &&
                draggingIndex !== index &&
                "rounded-xl ring-2 ring-foreground",
              draggingIndex === index && "opacity-50",
            )}
          >
            <PdfPageThumbnail
              document={document}
              pageId={page.id}
              pageNumber={page.pageNumber}
              selected={page.selected}
              disabled={disabled}
              rotation={page.rotation}
              reorderable={reorderable}
              overlay={renderPageOverlay?.(page)}
              onActivate={(event) => {
                onActivate(page, pageActivationFromPointerEvent(event));
              }}
              onKeyDown={(event) => {
                handleKeyDown(event, page);
              }}
              onReorderDragStart={() => {
                dragIndex.current = index;
                setDraggingIndex(index);
              }}
              onReorderDragEnd={() => {
                clearDragState();
              }}
            />
          </li>
        ))}
      </ul>
    </div>
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
