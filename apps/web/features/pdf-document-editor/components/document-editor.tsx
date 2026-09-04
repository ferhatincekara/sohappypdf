"use client";

import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { EditorPageNav } from "@/features/pdf-document-editor/components/editor-page-nav";
import { EditorPropertiesPanel } from "@/features/pdf-document-editor/components/editor-properties-panel";
import { EditorToolbar } from "@/features/pdf-document-editor/components/editor-toolbar";
import { EditorTopBar } from "@/features/pdf-document-editor/components/editor-top-bar";
import { EditorViewport } from "@/features/pdf-document-editor/components/editor-viewport";
import type {
  DocumentEditorAction,
  DocumentEditorState,
} from "@/features/pdf-document-editor/lib/document-editor-state";
import { selectedEditorObject } from "@/features/pdf-document-editor/lib/document-editor-state";
import {
  zoomToFitPage,
  zoomToFitWidth,
} from "@/features/pdf-document-editor/lib/editor-zoom";
import type {
  EditorObject,
  EditorTool,
} from "@/features/pdf-document-editor/types/editor-object";
import type { PdfjsDocument } from "@/features/public-tools/lib/pdfjs-client";
import { cn } from "@/lib/utils";

export type EditorPdfSource = {
  status: "idle" | "loading" | "ready" | "error";
  document: PdfjsDocument | null;
  errorKey: "passwordProtected" | "previewFailed" | null;
};

export function DocumentEditor({
  pdf,
  state,
  dispatch,
  availableTools,
  disabled = false,
  previewFailedMessage,
  passwordProtectedMessage,
  layout = "inline",
  title,
  extra,
  propertiesExtra,
  rectangleStyle,
  onBack,
  exportLabel,
  exportDisabled = false,
  onExport,
}: {
  pdf: EditorPdfSource;
  state: DocumentEditorState;
  dispatch: (action: DocumentEditorAction) => void;
  availableTools: readonly EditorTool[];
  disabled?: boolean;
  previewFailedMessage: string;
  passwordProtectedMessage: string;
  layout?: "inline" | "workspace";
  title?: string;
  extra?: ReactNode;
  propertiesExtra?: ReactNode;
  rectangleStyle?: "fill" | "highlight";
  onBack?: () => void;
  exportLabel?: string;
  exportDisabled?: boolean;
  onExport?: () => void;
}) {
  const selected = selectedEditorObject(state);
  const [mounted, setMounted] = useState(false);
  const [pageSize, setPageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [viewportSize, setViewportSize] = useState({
    width: 720,
    height: 640,
  });
  const isWorkspace = layout === "workspace";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isWorkspace) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isWorkspace]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (disabled) {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        dispatch({ type: event.shiftKey ? "redo" : "undo" });
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        dispatch({ type: "deleteSelected" });
        return;
      }

      if (event.key === "Escape") {
        if (state.selectedId !== null) {
          dispatch({ type: "select", id: null });
          return;
        }

        onBack?.();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [disabled, dispatch, onBack, state.selectedId]);

  if (pdf.status === "loading" || pdf.status === "idle") {
    return <div className="h-64 animate-pulse rounded-lg bg-muted" />;
  }

  if (pdf.status === "error" || pdf.document === null) {
    return (
      <p className="text-sm text-muted-foreground">
        {pdf.errorKey === "passwordProtected"
          ? passwordProtectedMessage
          : previewFailedMessage}
      </p>
    );
  }

  function applyFit(mode: "width" | "page"): void {
    if (pageSize === null) {
      return;
    }

    dispatch({
      type: "setZoom",
      zoom:
        mode === "width"
          ? zoomToFitWidth(pageSize.width, viewportSize.width)
          : zoomToFitPage(
              pageSize.width,
              pageSize.height,
              viewportSize.width,
              viewportSize.height,
            ),
    });
  }

  const editor = (
    <div
      className={cn(
        "flex min-h-0 flex-col bg-background",
        isWorkspace ? "h-full" : "gap-4",
      )}
    >
      {isWorkspace ? (
        <EditorTopBar
          title={title}
          canUndo={state.past.length > 0}
          canRedo={state.future.length > 0}
          zoom={state.zoom}
          disabled={disabled}
          exportLabel={exportLabel}
          exportDisabled={exportDisabled}
          onBack={onBack}
          onUndo={() => {
            dispatch({ type: "undo" });
          }}
          onRedo={() => {
            dispatch({ type: "redo" });
          }}
          onDelete={() => {
            dispatch({ type: "deleteSelected" });
          }}
          canDelete={state.selectedId !== null}
          onZoomIn={() => {
            dispatch({ type: "setZoom", zoom: state.zoom + 0.25 });
          }}
          onZoomOut={() => {
            dispatch({ type: "setZoom", zoom: state.zoom - 0.25 });
          }}
          onFitWidth={() => {
            applyFit("width");
          }}
          onFitPage={() => {
            applyFit("page");
          }}
          onExport={onExport}
        />
      ) : (
        <EditorToolbar
          state={state}
          availableTools={availableTools}
          canUndo={state.past.length > 0}
          canRedo={state.future.length > 0}
          disabled={disabled}
          orientation="horizontal"
          onTool={(tool) => {
            dispatch({ type: "setTool", tool });
          }}
          onUndo={() => {
            dispatch({ type: "undo" });
          }}
          onRedo={() => {
            dispatch({ type: "redo" });
          }}
          onDelete={() => {
            dispatch({ type: "deleteSelected" });
          }}
          onZoomIn={() => {
            dispatch({ type: "setZoom", zoom: state.zoom + 0.25 });
          }}
          onZoomOut={() => {
            dispatch({ type: "setZoom", zoom: state.zoom - 0.25 });
          }}
          onFitWidth={() => {
            applyFit("width");
          }}
          onFitPage={() => {
            applyFit("page");
          }}
        />
      )}

      {extra}

      <div
        className={cn(
          "min-h-0",
          isWorkspace
            ? "flex flex-1 flex-col md:flex-row"
            : "grid gap-4 lg:grid-cols-[minmax(0,1fr)_--spacing(64)]",
        )}
      >
        {isWorkspace ? (
          <div className="hidden shrink-0 border-r border-border md:flex">
            <EditorToolbar
              state={state}
              availableTools={availableTools}
              canUndo={state.past.length > 0}
              canRedo={state.future.length > 0}
              disabled={disabled}
              orientation="vertical"
              hideHistory
              hideZoom
              onTool={(tool) => {
                dispatch({ type: "setTool", tool });
              }}
              onUndo={() => {
                dispatch({ type: "undo" });
              }}
              onRedo={() => {
                dispatch({ type: "redo" });
              }}
              onDelete={() => {
                dispatch({ type: "deleteSelected" });
              }}
              onZoomIn={() => {
                dispatch({ type: "setZoom", zoom: state.zoom + 0.25 });
              }}
              onZoomOut={() => {
                dispatch({ type: "setZoom", zoom: state.zoom - 0.25 });
              }}
            />
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <EditorPageNav
            currentPage={state.currentPage}
            pageCount={state.pageCount}
            disabled={disabled}
            onPage={(page) => {
              dispatch({ type: "setCurrentPage", page });
            }}
          />
          <EditorViewport
            document={pdf.document}
            state={state}
            disabled={disabled}
            dispatch={dispatch}
            onPageSize={setPageSize}
            onViewportSize={setViewportSize}
            fill={isWorkspace}
            rectangleStyle={rectangleStyle}
          />
        </div>

        {isWorkspace ? (
          selected !== null ? (
            <div className="max-md:sticky max-md:bottom-20 max-md:z-20 md:w-72 md:shrink-0 md:overflow-y-auto md:border-l md:border-border md:p-4">
              <EditorPropertiesPanel
                object={selected}
                disabled={disabled}
                extra={propertiesExtra}
                onChange={(object: EditorObject) => {
                  dispatch({ type: "updateObject", id: object.id, object });
                }}
              />
            </div>
          ) : null
        ) : (
          <div className="max-lg:sticky max-lg:bottom-24 max-lg:z-20">
            <EditorPropertiesPanel
              object={selected}
              disabled={disabled}
              extra={propertiesExtra}
              onChange={(object: EditorObject) => {
                dispatch({ type: "updateObject", id: object.id, object });
              }}
            />
          </div>
        )}
      </div>

      {isWorkspace ? (
        <div className="border-t border-border p-2 md:hidden">
          <EditorToolbar
            state={state}
            availableTools={availableTools}
            canUndo={state.past.length > 0}
            canRedo={state.future.length > 0}
            disabled={disabled}
            orientation="horizontal"
            hideHistory
            hideZoom
            onTool={(tool) => {
              dispatch({ type: "setTool", tool });
            }}
            onUndo={() => {
              dispatch({ type: "undo" });
            }}
            onRedo={() => {
              dispatch({ type: "redo" });
            }}
            onDelete={() => {
              dispatch({ type: "deleteSelected" });
            }}
            onZoomIn={() => {
              dispatch({ type: "setZoom", zoom: state.zoom + 0.25 });
            }}
            onZoomOut={() => {
              dispatch({ type: "setZoom", zoom: state.zoom - 0.25 });
            }}
          />
        </div>
      ) : null}
    </div>
  );

  if (!isWorkspace) {
    return editor;
  }

  if (!mounted) {
    return <div className="h-64 animate-pulse rounded-lg bg-muted" />;
  }

  return createPortal(
    <div className="fixed inset-0 z-60 flex flex-col bg-background">
      {editor}
    </div>,
    document.body,
  );
}
