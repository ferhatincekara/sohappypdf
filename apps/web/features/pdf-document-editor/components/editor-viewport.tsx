"use client";

import {
  type PointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { EditorObjectView } from "@/features/pdf-document-editor/components/editor-object-view";
import { EditorPageCanvas } from "@/features/pdf-document-editor/components/editor-page-canvas";
import {
  createRectangleObject,
  createSignatureObject,
  createTextObject,
} from "@/features/pdf-document-editor/lib/create-editor-object";
import type {
  DocumentEditorAction,
  DocumentEditorState,
} from "@/features/pdf-document-editor/lib/document-editor-state";
import { objectsOnPage } from "@/features/pdf-document-editor/lib/document-editor-state";
import type {
  EditorObject,
  EditorTool,
} from "@/features/pdf-document-editor/types/editor-object";
import type { PdfjsDocument } from "@/features/public-tools/lib/pdfjs-client";
import { cn } from "@/lib/utils";

export function EditorViewport({
  document,
  state,
  disabled,
  dispatch,
  fill = false,
  rectangleStyle = "highlight",
  onPageSize,
  onViewportSize,
}: {
  document: PdfjsDocument;
  state: DocumentEditorState;
  disabled: boolean;
  dispatch: (action: DocumentEditorAction) => void;
  fill?: boolean;
  rectangleStyle?: "fill" | "highlight";
  onPageSize?: (size: { width: number; height: number }) => void;
  onViewportSize?: (size: { width: number; height: number }) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [pageSize, setPageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [frameWidth, setFrameWidth] = useState(560);
  const onSize = useCallback(
    (size: { width: number; height: number }) => {
      setPageSize(size);
      onPageSize?.(size);
    },
    [onPageSize],
  );

  useEffect(() => {
    const frame = frameRef.current;

    if (frame === null) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (entry === undefined) {
        return;
      }

      const width = entry.contentRect.width;
      const height = entry.contentRect.height;
      setFrameWidth(width);
      onViewportSize?.({ width, height });
    });

    observer.observe(frame);
    return () => {
      observer.disconnect();
    };
  }, [onViewportSize]);

  const baseWidth = pageSize === null ? 560 : pageSize.width;
  const displayWidth = Math.max(160, baseWidth * state.zoom);
  const scale = pageSize === null ? 1 : displayWidth / pageSize.width;
  const pageObjects = objectsOnPage(state.objects, state.currentPage);

  function pointFromEvent(event: PointerEvent<HTMLDivElement>): {
    x: number;
    y: number;
  } | null {
    if (pageSize === null) {
      return null;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) / scale,
      y: (event.clientY - bounds.top) / scale,
    };
  }

  function addAt(tool: EditorTool, x: number, y: number): EditorObject | null {
    if (tool === "text") {
      return createTextObject({ page: state.currentPage, x, y });
    }

    if (tool === "shape") {
      return createRectangleObject({
        page: state.currentPage,
        x,
        y,
        style: rectangleStyle,
      });
    }

    if (tool === "signature") {
      return createSignatureObject({ page: state.currentPage, x, y });
    }

    return null;
  }

  return (
    <div
      ref={frameRef}
      className={cn(
        "overflow-auto bg-muted/50",
        fill ? "min-h-0 flex-1" : "rounded-lg border border-border",
      )}
    >
      <div
        className="flex justify-center p-4 md:p-8"
        style={{ minWidth: Math.max(frameWidth, displayWidth + 64) }}
      >
        <div
          className="relative origin-top-left bg-white shadow-sm"
          style={{
            width: pageSize === null ? displayWidth : pageSize.width * scale,
            transform: `translate(${state.panX}px, ${state.panY}px)`,
          }}
          onPointerDown={(event) => {
            if (disabled) {
              return;
            }

            const point = pointFromEvent(event);

            if (point === null) {
              return;
            }

            const created = addAt(state.tool, point.x, point.y);

            if (created !== null) {
              dispatch({ type: "addObject", object: created });
              dispatch({ type: "setTool", tool: "select" });
              return;
            }

            dispatch({ type: "select", id: null });
          }}
        >
          <EditorPageCanvas
            document={document}
            pageNumber={state.currentPage}
            width={displayWidth}
            onSize={onSize}
          />
          {pageObjects.map((object) => (
            <EditorObjectView
              key={object.id}
              object={object}
              selected={state.selectedId === object.id}
              scale={scale}
              disabled={disabled}
              onSelect={() => {
                dispatch({ type: "select", id: object.id });
              }}
              onMove={(x, y) => {
                dispatch({
                  type: "replaceObject",
                  object: { ...object, x, y },
                });
              }}
              onResize={(width, height) => {
                dispatch({
                  type: "replaceObject",
                  object: {
                    ...object,
                    width: Math.max(16, width),
                    height: Math.max(16, height),
                  },
                });
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
