"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  type CropEdge,
  type CropMargins,
  moveCropMargins,
  resizeCropEdge,
} from "../../lib/crop-margins";
import type { PdfjsDocument } from "../../lib/pdfjs-client";

const PREVIEW_WIDTH = 320;

type DragMode =
  | { kind: "move"; startX: number; startY: number; start: CropMargins }
  | {
      kind: "edge";
      edge: CropEdge;
      startX: number;
      startY: number;
      start: CropMargins;
    };

function isRenderCancelled(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "RenderingCancelledException"
  );
}

export function CropPagePreview({
  document,
  margins,
  disabled,
  moveLabel,
  edgeLabel,
  onChange,
}: {
  document: PdfjsDocument;
  margins: CropMargins;
  disabled: boolean;
  moveLabel: string;
  edgeLabel: (edge: CropEdge) => string;
  onChange: (next: CropMargins) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<DragMode | null>(null);
  const marginsRef = useRef(margins);
  const onChangeRef = useRef(onChange);
  const scaleRef = useRef(1);
  const pageSizeRef = useRef<{ width: number; height: number } | null>(null);
  const [pageSize, setPageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [scale, setScale] = useState(1);

  marginsRef.current = margins;
  onChangeRef.current = onChange;
  scaleRef.current = scale;
  pageSizeRef.current = pageSize;

  useEffect(() => {
    let cancelled = false;
    let renderTask: { cancel: () => void } | null = null;

    void (async () => {
      const canvas = canvasRef.current;

      if (canvas === null) {
        return;
      }

      try {
        const page = await document.getPage(1);

        if (cancelled) {
          return;
        }

        const baseViewport = page.getViewport({ scale: 1 });
        const nextScale = PREVIEW_WIDTH / baseViewport.width;
        const viewport = page.getViewport({ scale: nextScale });
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
          setPageSize({
            width: baseViewport.width,
            height: baseViewport.height,
          });
          setScale(nextScale);
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
  }, [document]);

  useEffect(() => {
    function applyDrag(clientX: number, clientY: number): void {
      const drag = dragRef.current;
      const size = pageSizeRef.current;

      if (drag === null || size === null) {
        return;
      }

      const dx = (clientX - drag.startX) / scaleRef.current;
      const dy = (clientY - drag.startY) / scaleRef.current;

      if (drag.kind === "move") {
        onChangeRef.current(
          moveCropMargins(drag.start, dx, dy, size.width, size.height),
        );
        return;
      }

      const delta =
        drag.edge === "left"
          ? dx
          : drag.edge === "right"
            ? -dx
            : drag.edge === "top"
              ? dy
              : -dy;

      onChangeRef.current(
        resizeCropEdge(drag.start, drag.edge, delta, size.width, size.height),
      );
    }

    function onPointerMove(event: PointerEvent) {
      if (dragRef.current === null) {
        return;
      }

      applyDrag(event.clientX, event.clientY);
    }

    function onPointerUp() {
      dragRef.current = null;
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  const box =
    pageSize === null
      ? null
      : {
          top: margins.top * scale,
          right: margins.right * scale,
          bottom: margins.bottom * scale,
          left: margins.left * scale,
        };

  return (
    <div className="relative inline-block overflow-hidden rounded-lg border border-border bg-card shadow-xs">
      <canvas ref={canvasRef} className="block max-w-full" />
      {box === null ? null : (
        <div
          className="absolute border-2 border-foreground bg-foreground/10"
          style={{
            top: box.top,
            right: box.right,
            bottom: box.bottom,
            left: box.left,
          }}
        >
          <button
            type="button"
            disabled={disabled}
            aria-label={moveLabel}
            onPointerDown={(event) => {
              event.preventDefault();
              dragRef.current = {
                kind: "move",
                startX: event.clientX,
                startY: event.clientY,
                start: marginsRef.current,
              };
            }}
            className="absolute inset-0 cursor-move outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          {(["top", "right", "bottom", "left"] as const).map((edge) => (
            <button
              key={edge}
              type="button"
              disabled={disabled}
              aria-label={edgeLabel(edge)}
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                dragRef.current = {
                  kind: "edge",
                  edge,
                  startX: event.clientX,
                  startY: event.clientY,
                  start: marginsRef.current,
                };
              }}
              className={cn(
                "absolute bg-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                edge === "top" || edge === "bottom"
                  ? "left-1/2 h-3 w-11 -translate-x-1/2 cursor-ns-resize"
                  : "top-1/2 h-11 w-3 -translate-y-1/2 cursor-ew-resize",
                edge === "top" && "-top-1.5",
                edge === "bottom" && "-bottom-1.5",
                edge === "left" && "-left-1.5",
                edge === "right" && "-right-1.5",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
