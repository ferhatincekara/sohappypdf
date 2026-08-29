"use client";

import {
  HighlighterIcon,
  MousePointer2Icon,
  RedoIcon,
  SignatureIcon,
  Trash2Icon,
  TypeIcon,
  UndoIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  type DocumentEditorState,
  MAX_EDITOR_ZOOM,
  MIN_EDITOR_ZOOM,
} from "@/features/pdf-document-editor/lib/document-editor-state";
import type { EditorTool } from "@/features/pdf-document-editor/types/editor-object";

const TOOLS: readonly EditorTool[] = ["select", "text", "shape", "signature"];

export function EditorToolbar({
  state,
  availableTools,
  canUndo,
  canRedo,
  disabled,
  onTool,
  onUndo,
  onRedo,
  onDelete,
  onZoomIn,
  onZoomOut,
}: {
  state: DocumentEditorState;
  availableTools: readonly EditorTool[];
  canUndo: boolean;
  canRedo: boolean;
  disabled: boolean;
  onTool: (tool: EditorTool) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}) {
  const t = useTranslations("publicTools.editor");
  const tools = TOOLS.filter((tool) => availableTools.includes(tool));

  return (
    <div
      className="flex flex-nowrap items-center gap-1 overflow-x-auto rounded-lg bg-muted p-1 md:flex-wrap"
      role="toolbar"
      aria-label={t("toolbar")}
    >
      {tools.map((tool) => (
        <Button
          key={tool}
          type="button"
          size="icon"
          className="min-h-11 min-w-11"
          variant={state.tool === tool ? "secondary" : "ghost"}
          disabled={disabled}
          aria-pressed={state.tool === tool}
          aria-label={t(`tools.${tool}`)}
          onClick={() => {
            onTool(tool);
          }}
        >
          {tool === "select" ? <MousePointer2Icon /> : null}
          {tool === "text" ? <TypeIcon /> : null}
          {tool === "shape" ? <HighlighterIcon /> : null}
          {tool === "signature" ? <SignatureIcon /> : null}
        </Button>
      ))}
      <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
      <Button
        type="button"
        size="icon"
        className="min-h-11 min-w-11"
        variant="ghost"
        disabled={disabled || !canUndo}
        aria-label={t("undo")}
        aria-keyshortcuts="Control+z Meta+z"
        onClick={onUndo}
      >
        <UndoIcon />
      </Button>
      <Button
        type="button"
        size="icon"
        className="min-h-11 min-w-11"
        variant="ghost"
        disabled={disabled || !canRedo}
        aria-label={t("redo")}
        aria-keyshortcuts="Control+Shift+z Meta+Shift+z"
        onClick={onRedo}
      >
        <RedoIcon />
      </Button>
      <Button
        type="button"
        size="icon"
        className="min-h-11 min-w-11"
        variant="ghost"
        disabled={disabled || state.selectedId === null}
        aria-label={t("delete")}
        aria-keyshortcuts="Delete Backspace"
        onClick={onDelete}
      >
        <Trash2Icon />
      </Button>
      <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
      <Button
        type="button"
        size="icon"
        className="min-h-11 min-w-11"
        variant="ghost"
        disabled={disabled || state.zoom <= MIN_EDITOR_ZOOM}
        aria-label={t("zoomOut")}
        onClick={onZoomOut}
      >
        <ZoomOutIcon />
      </Button>
      <Button
        type="button"
        size="icon"
        className="min-h-11 min-w-11"
        variant="ghost"
        disabled={disabled || state.zoom >= MAX_EDITOR_ZOOM}
        aria-label={t("zoomIn")}
        onClick={onZoomIn}
      >
        <ZoomInIcon />
      </Button>
      <span className="px-2 text-xs text-muted-foreground" aria-live="polite">
        {Math.round(state.zoom * 100)}%
      </span>
    </div>
  );
}
