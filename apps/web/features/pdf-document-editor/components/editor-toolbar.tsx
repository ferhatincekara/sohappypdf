"use client";

import {
  HighlighterIcon,
  ImageIcon,
  Maximize2Icon,
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
import { cn } from "@/lib/utils";

const TOOLS: readonly EditorTool[] = [
  "select",
  "text",
  "image",
  "shape",
  "signature",
];

export function EditorToolbar({
  state,
  availableTools,
  canUndo,
  canRedo,
  disabled,
  orientation = "horizontal",
  hideHistory = false,
  hideZoom = false,
  onTool,
  onUndo,
  onRedo,
  onDelete,
  onZoomIn,
  onZoomOut,
  onFitWidth,
  onFitPage,
}: {
  state: DocumentEditorState;
  availableTools: readonly EditorTool[];
  canUndo: boolean;
  canRedo: boolean;
  disabled: boolean;
  orientation?: "horizontal" | "vertical";
  hideHistory?: boolean;
  hideZoom?: boolean;
  onTool: (tool: EditorTool) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitWidth?: () => void;
  onFitPage?: () => void;
}) {
  const t = useTranslations("publicTools.editor");
  const tools = TOOLS.filter((tool) => availableTools.includes(tool));
  const vertical = orientation === "vertical";

  return (
    <div
      className={cn(
        "flex items-center gap-1 bg-muted p-1",
        vertical
          ? "h-full w-14 flex-col rounded-none py-2"
          : "flex-nowrap overflow-x-auto rounded-lg md:flex-wrap",
      )}
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
          {tool === "image" ? <ImageIcon /> : null}
          {tool === "shape" ? <HighlighterIcon /> : null}
          {tool === "signature" ? <SignatureIcon /> : null}
        </Button>
      ))}
      {hideHistory ? null : (
        <>
          <span
            className={cn(
              "bg-border",
              vertical ? "my-1 h-px w-6" : "mx-1 h-6 w-px",
            )}
            aria-hidden="true"
          />
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
        </>
      )}
      {hideZoom ? null : (
        <>
          <span
            className={cn(
              "bg-border",
              vertical ? "my-1 h-px w-6" : "mx-1 h-6 w-px",
            )}
            aria-hidden="true"
          />
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
          {onFitWidth !== undefined ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={disabled}
              aria-label={t("fitWidth")}
              onClick={onFitWidth}
            >
              {t("fitWidth")}
            </Button>
          ) : null}
          {onFitPage !== undefined ? (
            <Button
              type="button"
              size="icon"
              className="min-h-11 min-w-11"
              variant="ghost"
              disabled={disabled}
              aria-label={t("fitPage")}
              onClick={onFitPage}
            >
              <Maximize2Icon />
            </Button>
          ) : null}
          <span
            className="px-2 text-xs text-muted-foreground"
            aria-live="polite"
          >
            {Math.round(state.zoom * 100)}%
          </span>
        </>
      )}
    </div>
  );
}
