"use client";

import { type PointerEvent, useCallback, useState } from "react";
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

const VIEW_WIDTH = 560;

export function EditorViewport({
  document,
  state,
  disabled,
  dispatch,
}: {
  document: PdfjsDocument;
  state: DocumentEditorState;
  disabled: boolean;
  dispatch: (action: DocumentEditorAction) => void;
}) {
  const [pageSize, setPageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const onSize = useCallback((size: { width: number; height: number }) => {
    setPageSize(size);
  }, []);
  const displayWidth = VIEW_WIDTH * state.zoom;
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
      return createRectangleObject({ page: state.currentPage, x, y });
    }

    if (tool === "signature") {
      return createSignatureObject({ page: state.currentPage, x, y });
    }

    return null;
  }

  return (
    <div className="overflow-auto rounded-lg border border-border bg-white p-4">
      <div
        className="relative mx-auto origin-top-left bg-white shadow-xs"
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
          />
        ))}
      </div>
    </div>
  );
}
