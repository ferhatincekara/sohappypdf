"use client";

import { FileIcon, GripVerticalIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  formatFileSize,
  formatUploadProgress,
} from "@/features/files/lib/format-file-size";
import { cn } from "@/lib/utils";
import { fileExtensionLabel, type WorkspaceFile } from "../lib/workspace-files";

export function ToolFileList({
  files,
  reorderable,
  disabled,
  onMove,
  onReorder,
  onRemove,
  onRetry,
}: {
  files: readonly WorkspaceFile[];
  reorderable: boolean;
  disabled: boolean;
  onMove: (index: number, direction: -1 | 1) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}) {
  const t = useTranslations("publicTools");
  const dragIndex = useRef<number | null>(null);

  if (files.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-col gap-2" aria-label={t("workspace.fileList")}>
      {files.map((entry, index) => (
        <li
          key={entry.id}
          draggable={reorderable && !disabled}
          onDragStart={() => {
            dragIndex.current = index;
          }}
          onDragOver={(event) => {
            if (!reorderable || disabled) {
              return;
            }

            event.preventDefault();
          }}
          onDrop={(event) => {
            event.preventDefault();

            if (
              !reorderable ||
              disabled ||
              dragIndex.current === null ||
              dragIndex.current === index
            ) {
              return;
            }

            onReorder(dragIndex.current, index);
            dragIndex.current = null;
          }}
          className={cn(
            "flex items-start gap-3 rounded-lg border border-border bg-card p-3",
            reorderable && !disabled && "cursor-grab active:cursor-grabbing",
          )}
        >
          <FileThumbnail entry={entry} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {entry.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {fileExtensionLabel(entry.file.name)} ·{" "}
                  {formatFileSize(entry.file.size)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {reorderable ? (
                  <>
                    <span className="hidden text-muted-foreground sm:inline">
                      <GripVerticalIcon className="size-4" aria-hidden="true" />
                    </span>
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="outline"
                      disabled={disabled || index === 0}
                      aria-label={t("moveUp")}
                      onClick={() => {
                        onMove(index, -1);
                      }}
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="outline"
                      disabled={disabled || index === files.length - 1}
                      aria-label={t("moveDown")}
                      onClick={() => {
                        onMove(index, 1);
                      }}
                    >
                      ↓
                    </Button>
                  </>
                ) : null}
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  disabled={disabled}
                  aria-label={t("workspace.removeFile", {
                    name: entry.file.name,
                  })}
                  onClick={() => {
                    onRemove(entry.id);
                  }}
                >
                  <XIcon className="size-3.5" />
                </Button>
              </div>
            </div>
            <FileStatusRow
              entry={entry}
              onRetry={onRetry}
              disabled={disabled}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function FileThumbnail({ entry }: { entry: WorkspaceFile }) {
  if (entry.previewUrl !== null) {
    return (
      // biome-ignore lint/performance/noImgElement: local object URL preview
      <img
        src={entry.previewUrl}
        alt=""
        className="size-12 shrink-0 rounded-md border border-border object-cover"
      />
    );
  }

  return (
    <span className="flex size-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
      <FileIcon className="size-5" aria-hidden="true" />
    </span>
  );
}

function FileStatusRow({
  entry,
  onRetry,
  disabled,
}: {
  entry: WorkspaceFile;
  onRetry: (id: string) => void;
  disabled: boolean;
}) {
  const t = useTranslations("publicTools");

  if (entry.status === "uploading") {
    const percent = entry.progress.percent;
    return (
      <div className="mt-2 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{t("phases.uploading")}</span>
          <span className="tabular-nums">
            {entry.progress.total > 0
              ? formatUploadProgress(
                  entry.progress.loaded,
                  entry.progress.total,
                )
              : null}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label={t("phases.uploading")}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="h-1.5 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full bg-foreground motion-safe:transition-[width] motion-safe:duration-150"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    );
  }

  if (entry.status === "failed") {
    return (
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <p className="text-xs text-destructive">
          {entry.errorKey !== null
            ? t(`errors.${entry.errorKey}`)
            : t("errors.networkFailure")}
        </p>
        <Button
          type="button"
          size="xs"
          variant="outline"
          disabled={disabled}
          onClick={() => {
            onRetry(entry.id);
          }}
        >
          {t("workspace.retry")}
        </Button>
      </div>
    );
  }

  if (entry.status === "ready") {
    return (
      <p className="mt-2 text-xs text-muted-foreground">
        {t("workspace.fileReady")}
      </p>
    );
  }

  return (
    <p className="mt-2 text-xs text-muted-foreground">
      {t("workspace.filePending")}
    </p>
  );
}
