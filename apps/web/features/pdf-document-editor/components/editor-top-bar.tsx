"use client";

import {
  ArrowLeftIcon,
  Maximize2Icon,
  RedoIcon,
  Trash2Icon,
  UndoIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  MAX_EDITOR_ZOOM,
  MIN_EDITOR_ZOOM,
} from "@/features/pdf-document-editor/lib/document-editor-state";

export function EditorTopBar({
  title,
  canUndo,
  canRedo,
  canDelete,
  zoom,
  disabled,
  exportLabel,
  exportDisabled,
  onBack,
  onUndo,
  onRedo,
  onDelete,
  onZoomIn,
  onZoomOut,
  onFitWidth,
  onFitPage,
  onExport,
}: {
  title?: string;
  canUndo: boolean;
  canRedo: boolean;
  canDelete: boolean;
  zoom: number;
  disabled: boolean;
  exportLabel?: string;
  exportDisabled?: boolean;
  onBack?: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitWidth: () => void;
  onFitPage: () => void;
  onExport?: () => void;
}) {
  const t = useTranslations("publicTools.editor");

  return (
    <header className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2 md:px-4">
      {onBack !== undefined ? (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="min-h-11 min-w-11"
          aria-label={t("back")}
          onClick={onBack}
        >
          <ArrowLeftIcon />
        </Button>
      ) : null}

      {title !== undefined && title.length > 0 ? (
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
          {title}
        </p>
      ) : (
        <span className="flex-1" />
      )}

      <div
        className="hidden items-center gap-1 sm:flex"
        role="toolbar"
        aria-label={t("toolbar")}
      >
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="min-h-11 min-w-11"
          disabled={disabled || !canUndo}
          aria-label={t("undo")}
          onClick={onUndo}
        >
          <UndoIcon />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="min-h-11 min-w-11"
          disabled={disabled || !canRedo}
          aria-label={t("redo")}
          onClick={onRedo}
        >
          <RedoIcon />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="min-h-11 min-w-11"
          disabled={disabled || !canDelete}
          aria-label={t("delete")}
          onClick={onDelete}
        >
          <Trash2Icon />
        </Button>
        <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="min-h-11 min-w-11"
          disabled={disabled || zoom <= MIN_EDITOR_ZOOM}
          aria-label={t("zoomOut")}
          onClick={onZoomOut}
        >
          <ZoomOutIcon />
        </Button>
        <span className="min-w-12 text-center text-xs text-muted-foreground">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="min-h-11 min-w-11"
          disabled={disabled || zoom >= MAX_EDITOR_ZOOM}
          aria-label={t("zoomIn")}
          onClick={onZoomIn}
        >
          <ZoomInIcon />
        </Button>
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
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="min-h-11 min-w-11"
          disabled={disabled}
          aria-label={t("fitPage")}
          onClick={onFitPage}
        >
          <Maximize2Icon />
        </Button>
      </div>

      {onExport !== undefined && exportLabel !== undefined ? (
        <Button
          type="button"
          size="sm"
          disabled={disabled || exportDisabled}
          onClick={onExport}
        >
          {exportLabel}
        </Button>
      ) : null}
    </header>
  );
}
