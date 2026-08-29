"use client";

import { CheckIcon, GripVerticalIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import type { PdfjsDocument } from "@/features/public-tools/lib/pdfjs-client";
import { thumbnailOutputScale } from "@/features/public-tools/pdf-workspace/lib/thumbnail-output-scale";
import type { PdfPageRotation } from "@/features/public-tools/pdf-workspace/types/pdf-page";
import { cn } from "@/lib/utils";

const THUMBNAIL_WIDTH = 160;

type ThumbnailStatus = "pending" | "ready" | "error";

function isRenderCancelled(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "RenderingCancelledException"
  );
}

function pageLabel(
  t: ReturnType<typeof useTranslations>,
  pageNumber: number,
  selected: boolean,
  rotation: PdfPageRotation,
): string {
  if (rotation === 0) {
    return selected
      ? t("pageLabelSelected", { number: pageNumber })
      : t("pageLabel", { number: pageNumber });
  }

  return selected
    ? t("pageLabelSelectedRotated", { number: pageNumber, degrees: rotation })
    : t("pageLabelRotated", { number: pageNumber, degrees: rotation });
}

export function PdfPageThumbnail({
  document,
  pageId,
  pageNumber,
  selected,
  disabled,
  rotation = 0,
  reorderable = false,
  overlay,
  interactive = true,
  showLabel = true,
  className,
  onActivate,
  onKeyDown,
  onReorderDragStart,
  onReorderDragEnd,
}: {
  document: PdfjsDocument;
  pageId: string;
  pageNumber: number;
  selected: boolean;
  disabled: boolean;
  rotation?: PdfPageRotation;
  reorderable?: boolean;
  overlay?: ReactNode;
  interactive?: boolean;
  showLabel?: boolean;
  className?: string;
  onActivate?: (event: {
    shiftKey: boolean;
    metaKey: boolean;
    ctrlKey: boolean;
  }) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void;
  onReorderDragStart?: (event: DragEvent<HTMLButtonElement>) => void;
  onReorderDragEnd?: () => void;
}) {
  const t = useTranslations("publicTools.pages");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const visibleRef = useRef(false);
  const [status, setStatus] = useState<ThumbnailStatus>("pending");
  const isQuarterTurn = rotation === 90 || rotation === 270;

  useEffect(() => {
    const root = rootRef.current;

    if (root === null) {
      return;
    }

    let cancelled = false;
    let renderTask: { cancel: () => void } | null = null;
    setStatus("pending");

    async function renderPage() {
      const canvas = canvasRef.current;

      if (canvas === null || !visibleRef.current || cancelled) {
        return;
      }

      try {
        const page = await document.getPage(pageNumber);

        if (cancelled) {
          return;
        }

        const baseViewport = page.getViewport({ scale: 1 });
        const scale = THUMBNAIL_WIDTH / baseViewport.width;
        const viewport = page.getViewport({ scale });
        const outputScale = thumbnailOutputScale(window.devicePixelRatio || 1);
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        const context = canvas.getContext("2d");

        if (context === null) {
          setStatus("error");
          return;
        }

        context.setTransform(outputScale, 0, 0, outputScale, 0, 0);
        const task = page.render({
          canvas,
          viewport,
        });
        renderTask = task;
        await task.promise;

        if (!cancelled) {
          setStatus("ready");
        }
      } catch (error: unknown) {
        if (cancelled || isRenderCancelled(error)) {
          return;
        }

        setStatus("error");
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting);
        visibleRef.current = isVisible;

        if (isVisible) {
          void renderPage();
          return;
        }

        renderTask?.cancel();
        renderTask = null;
        const canvas = canvasRef.current;

        if (canvas !== null) {
          canvas.width = 0;
          canvas.height = 0;
        }

        if (!cancelled) {
          setStatus("pending");
        }
      },
      { rootMargin: "160px" },
    );

    observer.observe(root);

    return () => {
      cancelled = true;
      renderTask?.cancel();
      observer.disconnect();
    };
  }, [document, pageNumber]);

  return (
    <div
      ref={rootRef}
      className={cn(
        "group flex w-full min-h-11 flex-col items-center gap-2 rounded-3 p-2 text-left",
        interactive && selected ? "bg-foreground/8" : null,
        interactive && !selected ? "hover:bg-muted/70" : null,
        disabled && "opacity-60",
        className,
      )}
    >
      <span
        className={cn(
          "relative flex aspect-3/4 w-full items-center justify-center overflow-hidden rounded-1.5 border bg-card shadow-xs",
          selected
            ? "border-foreground"
            : "border-border group-hover:border-foreground/40",
        )}
      >
        <button
          ref={buttonRef}
          type="button"
          data-pdf-page={pageNumber}
          data-pdf-page-id={pageId}
          disabled={disabled || !interactive}
          tabIndex={interactive ? undefined : -1}
          aria-hidden={!interactive}
          aria-pressed={interactive ? selected : undefined}
          aria-label={
            interactive
              ? pageLabel(t, pageNumber, selected, rotation)
              : undefined
          }
          aria-keyshortcuts={
            reorderable && interactive
              ? "Alt+ArrowLeft Alt+ArrowRight"
              : undefined
          }
          onClick={(event) => {
            if (!interactive) {
              return;
            }

            onActivate?.(event);
          }}
          onKeyDown={onKeyDown}
          className="absolute inset-0 z-0 flex items-center justify-center outline-none"
        >
          {status === "pending" ? (
            <span
              className="absolute inset-0 animate-pulse bg-muted"
              aria-hidden="true"
            />
          ) : null}

          {status === "error" ? (
            <span className="absolute inset-0 flex items-center justify-center bg-muted/50 p-2 text-center text-[11px] leading-snug text-muted-foreground">
              {t("pagePreviewFailed")}
            </span>
          ) : null}

          <canvas
            ref={canvasRef}
            className={cn(
              "block max-h-full max-w-full",
              status === "ready" ? "opacity-100" : "opacity-0",
            )}
            style={
              rotation === 0
                ? undefined
                : {
                    transform: isQuarterTurn
                      ? `rotate(${rotation}deg) scale(0.75)`
                      : `rotate(${rotation}deg)`,
                  }
            }
          />

          {interactive && selected ? (
            <span className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-foreground text-background shadow-xs">
              <CheckIcon className="size-3.5" aria-hidden="true" />
            </span>
          ) : null}
        </button>

        {reorderable ? (
          <button
            type="button"
            draggable={!disabled}
            disabled={disabled}
            aria-label={t("reorderHandle", { number: pageNumber })}
            onClick={(event) => {
              event.stopPropagation();
            }}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", pageId);
              onReorderDragStart?.(event);
            }}
            onDragEnd={() => {
              onReorderDragEnd?.();
            }}
            className={cn(
              "absolute top-1.5 left-1.5 z-10 flex size-11 items-center justify-center rounded-md bg-background/90 text-muted-foreground shadow-xs",
              "hover:text-foreground outline-none",
              disabled
                ? "cursor-not-allowed"
                : "cursor-grab active:cursor-grabbing",
            )}
          >
            <GripVerticalIcon className="size-4" aria-hidden="true" />
          </button>
        ) : null}

        {overlay}
      </span>
      {showLabel ? (
        <span
          className={cn(
            "text-xs font-medium",
            selected ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {pageNumber}
        </span>
      ) : null}
    </div>
  );
}
