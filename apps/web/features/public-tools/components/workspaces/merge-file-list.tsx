"use client";

import { GripVerticalIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  formatFileSize,
  formatUploadProgress,
} from "@/features/files/lib/format-file-size";
import { cn } from "@/lib/utils";
import {
  fileExtensionLabel,
  type WorkspaceFile,
} from "../../lib/workspace-files";
import { PdfPageThumbnail, usePdfDocument } from "../../pdf-workspace";

export function MergeFileList({
  files,
  disabled,
  onMove,
  onReorder,
  onRemove,
  onRetry,
  onPageCount,
}: {
  files: readonly WorkspaceFile[];
  disabled: boolean;
  onMove: (index: number, direction: -1 | 1) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onPageCount: (id: string, pageCount: number | null) => void;
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
          draggable={!disabled}
          onDragStart={() => {
            dragIndex.current = index;
          }}
          onDragOver={(event) => {
            if (disabled) {
              return;
            }

            event.preventDefault();
          }}
          onDrop={(event) => {
            event.preventDefault();

            if (
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
            "flex items-start gap-3 rounded-xl border border-border bg-card p-3",
            !disabled && "cursor-grab active:cursor-grabbing",
          )}
        >
          <MergeFileRow
            entry={entry}
            index={index}
            lastIndex={files.length - 1}
            disabled={disabled}
            onMove={onMove}
            onRemove={onRemove}
            onRetry={onRetry}
            onPageCount={onPageCount}
          />
        </li>
      ))}
    </ul>
  );
}

function MergeFileRow({
  entry,
  index,
  lastIndex,
  disabled,
  onMove,
  onRemove,
  onRetry,
  onPageCount,
}: {
  entry: WorkspaceFile;
  index: number;
  lastIndex: number;
  disabled: boolean;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onPageCount: (id: string, pageCount: number | null) => void;
}) {
  const t = useTranslations("publicTools");
  const pdf = usePdfDocument(entry.file);
  const pageCount = pdf.status === "ready" ? pdf.pageCount : null;

  useEffect(() => {
    onPageCount(entry.id, pageCount);
  }, [entry.id, onPageCount, pageCount]);

  return (
    <>
      {pdf.status === "ready" && pdf.document !== null ? (
        <PdfPageThumbnail
          document={pdf.document}
          pageId={`${entry.id}-cover`}
          pageNumber={1}
          selected={false}
          disabled={false}
          interactive={false}
          showLabel={false}
          className="w-16 shrink-0 p-0 min-h-0"
        />
      ) : (
        <div
          className="aspect-[3/4] w-16 shrink-0 animate-pulse rounded-lg border border-border bg-muted"
          aria-hidden="true"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {entry.file.name}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {fileExtensionLabel(entry.file.name)} ·{" "}
              {formatFileSize(entry.file.size)}
              {pageCount === null || pageCount < 1
                ? null
                : ` · ${t("workspace.pageCount", { count: pageCount })}`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
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
              disabled={disabled || index === lastIndex}
              aria-label={t("moveDown")}
              onClick={() => {
                onMove(index, 1);
              }}
            >
              ↓
            </Button>
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
        <MergeFileStatus entry={entry} disabled={disabled} onRetry={onRetry} />
      </div>
    </>
  );
}

function MergeFileStatus({
  entry,
  disabled,
  onRetry,
}: {
  entry: WorkspaceFile;
  disabled: boolean;
  onRetry: (id: string) => void;
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
