"use client";

import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import type { PdfjsDocument } from "../../lib/pdfjs-client";

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

export function PdfPageThumbnail({
  document,
  pageNumber,
  selected,
  disabled,
  overlay,
  onActivate,
  onKeyDown,
}: {
  document: PdfjsDocument;
  pageNumber: number;
  selected: boolean;
  disabled: boolean;
  overlay?: ReactNode;
  onActivate: (event: {
    shiftKey: boolean;
    metaKey: boolean;
    ctrlKey: boolean;
  }) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void;
}) {
  const t = useTranslations("publicTools.pages");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const visibleRef = useRef(false);
  const [status, setStatus] = useState<ThumbnailStatus>("pending");

  useEffect(() => {
    const button = buttonRef.current;

    if (button === null) {
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
        const outputScale = window.devicePixelRatio || 1;
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
        visibleRef.current = entries.some((entry) => entry.isIntersecting);
        if (visibleRef.current) {
          void renderPage();
        }
      },
      { rootMargin: "160px" },
    );

    observer.observe(button);

    return () => {
      cancelled = true;
      renderTask?.cancel();
      observer.disconnect();
    };
  }, [document, pageNumber]);

  return (
    <button
      ref={buttonRef}
      type="button"
      data-pdf-page={pageNumber}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={
        selected
          ? t("pageLabelSelected", { number: pageNumber })
          : t("pageLabel", { number: pageNumber })
      }
      onClick={(event) => {
        onActivate(event);
      }}
      onKeyDown={onKeyDown}
      className={cn(
        "group flex w-full min-h-11 flex-col items-center gap-2 rounded-xl p-2 text-left outline-none transition-colors",
        "focus-visible:ring-3 focus-visible:ring-ring/50",
        selected ? "bg-foreground/8" : "hover:bg-muted/70",
        disabled && "opacity-60",
      )}
    >
      <span
        className={cn(
          "relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-lg border-2 bg-card shadow-xs",
          selected
            ? "border-foreground"
            : "border-border group-hover:border-foreground/40",
        )}
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
        />

        {selected ? (
          <span className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-foreground text-background shadow-xs">
            <CheckIcon className="size-3.5" aria-hidden="true" />
          </span>
        ) : null}

        {overlay}
      </span>
      <span
        className={cn(
          "text-xs font-medium",
          selected ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {pageNumber}
      </span>
    </button>
  );
}
