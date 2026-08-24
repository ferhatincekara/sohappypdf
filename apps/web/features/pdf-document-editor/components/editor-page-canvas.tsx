"use client";

import { useEffect, useRef } from "react";
import type { PdfjsDocument } from "@/features/public-tools/lib/pdfjs-client";

function isRenderCancelled(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "RenderingCancelledException"
  );
}

export function EditorPageCanvas({
  document,
  pageNumber,
  width,
  onSize,
}: {
  document: PdfjsDocument;
  pageNumber: number;
  width: number;
  onSize: (size: { width: number; height: number }) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    let renderTask: { cancel: () => void } | null = null;

    void (async () => {
      const canvas = canvasRef.current;

      if (canvas === null) {
        return;
      }

      try {
        const page = await document.getPage(pageNumber);

        if (cancelled) {
          return;
        }

        const baseViewport = page.getViewport({ scale: 1 });
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
        const task = page.render({ canvas, viewport });
        renderTask = task;
        await task.promise;

        if (!cancelled) {
          onSize({ width: baseViewport.width, height: baseViewport.height });
        }
      } catch (error: unknown) {
        if (cancelled || isRenderCancelled(error)) {
          return;
        }
      }
    })();

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [document, pageNumber, width, onSize]);

  return <canvas ref={canvasRef} className="block max-w-full bg-white" />;
}
