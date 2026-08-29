"use client";

import { useEffect } from "react";
import { EditorPageNav } from "@/features/pdf-document-editor/components/editor-page-nav";
import { EditorPropertiesPanel } from "@/features/pdf-document-editor/components/editor-properties-panel";
import { EditorToolbar } from "@/features/pdf-document-editor/components/editor-toolbar";
import { EditorViewport } from "@/features/pdf-document-editor/components/editor-viewport";
import type {
  DocumentEditorAction,
  DocumentEditorState,
} from "@/features/pdf-document-editor/lib/document-editor-state";
import { selectedEditorObject } from "@/features/pdf-document-editor/lib/document-editor-state";
import type {
  EditorObject,
  EditorTool,
} from "@/features/pdf-document-editor/types/editor-object";
import type { PdfjsDocument } from "@/features/public-tools/lib/pdfjs-client";

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
}: {
  pdf: EditorPdfSource;
  state: DocumentEditorState;
  dispatch: (action: DocumentEditorAction) => void;
  availableTools: readonly EditorTool[];
  disabled?: boolean;
  previewFailedMessage: string;
  passwordProtectedMessage: string;
}) {
  const selected = selectedEditorObject(state);

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
        dispatch({ type: "select", id: null });
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [disabled, dispatch]);

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

  return (
    <div className="flex flex-col gap-4">
      <EditorToolbar
        state={state}
        availableTools={availableTools}
        canUndo={state.past.length > 0}
        canRedo={state.future.length > 0}
        disabled={disabled}
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
      <EditorPageNav
        currentPage={state.currentPage}
        pageCount={state.pageCount}
        disabled={disabled}
        onPage={(page) => {
          dispatch({ type: "setCurrentPage", page });
        }}
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_--spacing(64)]">
        <EditorViewport
          document={pdf.document}
          state={state}
          disabled={disabled}
          dispatch={dispatch}
        />
        <div className="max-lg:sticky max-lg:bottom-24 max-lg:z-20">
          <EditorPropertiesPanel
            object={selected}
            disabled={disabled}
            onChange={(object: EditorObject) => {
              dispatch({ type: "updateObject", id: object.id, object });
            }}
          />
        </div>
      </div>
    </div>
  );
}
