"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { PdfjsDocument } from "../../lib/pdfjs-client";

export function PdfPageThumbnail({
  document,
  pageNumber,
  selected,
  disabled,
  onToggle,
}: {
  document: PdfjsDocument;
  pageNumber: number;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations("publicTools.pages");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const visibleRef = useRef(false);

  useEffect(() => {
    const button = buttonRef.current;

    if (button === null) {
      return;
    }

    let cancelled = false;
    let renderTask: { cancel: () => void } | null = null;

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
        const width = 140;
        const scale = width / baseViewport.width;
        const viewport = page.getViewport({ scale });
        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        const context = canvas.getContext("2d");

        if (context === null) {
          return;
        }

        context.setTransform(outputScale, 0, 0, outputScale, 0, 0);
        const task = page.render({
          canvas,
          viewport,
        });
        renderTask = task;
        await task.promise;
      } catch {
        // Cancelled renders and destroyed documents reject; ignore on unmount.
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
      disabled={disabled}
      aria-pressed={selected}
      aria-label={t("pageLabel", { number: pageNumber })}
      onClick={onToggle}
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg p-1.5 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
        selected
          ? "bg-foreground/8 ring-2 ring-foreground"
          : "hover:bg-muted/60",
        disabled && "opacity-60",
      )}
    >
      <span className="overflow-hidden rounded-md border border-border bg-card shadow-xs">
        <canvas ref={canvasRef} className="block max-w-full" />
      </span>
      <span className="text-xs font-medium text-muted-foreground">
        {pageNumber}
      </span>
    </button>
  );
}
