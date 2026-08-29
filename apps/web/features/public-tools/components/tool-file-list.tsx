"use client";

import { GripVerticalIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/features/files/lib/format-file-size";
import { ToolFileErrorLine } from "@/features/public-tools/components/tool-file-error-line";
import { ToolFilePreview } from "@/features/public-tools/components/tool-file-preview";
import { ToolFileUploadProgress } from "@/features/public-tools/components/tool-file-upload-progress";
import {
  fileExtensionLabel,
  type WorkspaceFile,
} from "@/features/public-tools/lib/workspace-files";
import { cn } from "@/lib/utils";

export function ToolFileList({
  files,
  reorderable,
  disabled,
  awaitingSignIn = false,
  maxPagesPerFile = null,
  onMove,
  onReorder,
  onRemove,
  onRetry,
}: {
  files: readonly WorkspaceFile[];
  reorderable: boolean;
  disabled: boolean;
  awaitingSignIn?: boolean;
  maxPagesPerFile?: number | null;
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
    <ul className="divide-y divide-border" aria-label={t("workspace.fileList")}>
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
            "flex items-center gap-3 py-3",
            reorderable && !disabled && "cursor-grab active:cursor-grabbing",
          )}
        >
          <ToolFilePreview entry={entry} className="size-12" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {entry.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {fileExtensionLabel(entry.file.name)} ·{" "}
                  {formatFileSize(entry.file.size)}
                  {entry.pageCount === null
                    ? null
                    : ` · ${t("workspace.pageCount", { count: entry.pageCount })}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                {reorderable ? (
                  <>
                    <span className="hidden px-1 text-muted-foreground sm:inline">
                      <GripVerticalIcon className="size-4" aria-hidden="true" />
                    </span>
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      className="rounded-2"
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
                      variant="ghost"
                      className="rounded-2"
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
                  className="rounded-2"
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
              awaitingSignIn={awaitingSignIn}
              maxPagesPerFile={maxPagesPerFile}
              onRetry={onRetry}
              disabled={disabled}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function FileStatusRow({
  entry,
  awaitingSignIn,
  maxPagesPerFile,
  onRetry,
  disabled,
}: {
  entry: WorkspaceFile;
  awaitingSignIn: boolean;
  maxPagesPerFile: number | null;
  onRetry: (id: string) => void;
  disabled: boolean;
}) {
  const t = useTranslations("publicTools");

  if (entry.status === "inspecting") {
    return (
      <ToolFileUploadProgress
        percent={0}
        label={t("phases.checkingPages")}
        determinate={false}
      />
    );
  }

  if (entry.status === "uploading" || entry.status === "pending") {
    if (awaitingSignIn && entry.status === "pending") {
      return (
        <p className="mt-2 text-xs text-muted-foreground">
          {t("workspace.filePendingSignIn")}
        </p>
      );
    }

    return (
      <ToolFileUploadProgress
        percent={entry.progress.percent}
        label={t("phases.uploading")}
        determinate={entry.progress.total > 0}
      />
    );
  }

  if (entry.status === "failed") {
    return (
      <ToolFileErrorLine
        errorKey={entry.errorKey}
        maxPagesPerFile={maxPagesPerFile}
        disabled={disabled}
        onRetry={() => {
          onRetry(entry.id);
        }}
      />
    );
  }

  if (entry.status === "ready") {
    return (
      <p className="mt-2 text-xs text-muted-foreground">
        {t("workspace.fileReady")}
      </p>
    );
  }

  return null;
}
