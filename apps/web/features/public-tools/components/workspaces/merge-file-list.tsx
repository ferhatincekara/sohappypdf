"use client";

import { GripVerticalIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/features/files/lib/format-file-size";
import { cn } from "@/lib/utils";
import {
  fileExtensionLabel,
  type WorkspaceFile,
} from "../../lib/workspace-files";
import { PdfPageThumbnail, usePdfDocument } from "../../pdf-workspace";
import { ToolFileErrorLine } from "../tool-file-error-line";
import { ToolFileUploadProgress } from "../tool-file-upload-progress";

export function MergeFileList({
  files,
  disabled,
  maxPagesPerFile = null,
  onMove,
  onReorder,
  onRemove,
  onRetry,
  onPageCount,
}: {
  files: readonly WorkspaceFile[];
  disabled: boolean;
  maxPagesPerFile?: number | null;
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
    <ul className="divide-y divide-border" aria-label={t("workspace.fileList")}>
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
            "flex items-center gap-3 py-3",
            !disabled && "cursor-grab active:cursor-grabbing",
          )}
        >
          <MergeFileRow
            entry={entry}
            index={index}
            lastIndex={files.length - 1}
            disabled={disabled}
            maxPagesPerFile={maxPagesPerFile}
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
  maxPagesPerFile,
  onMove,
  onRemove,
  onRetry,
  onPageCount,
}: {
  entry: WorkspaceFile;
  index: number;
  lastIndex: number;
  disabled: boolean;
  maxPagesPerFile: number | null;
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
          className="w-12 shrink-0 rounded-none p-0 min-h-0"
        />
      ) : (
        <div
          className="aspect-3/4 w-12 shrink-0 animate-pulse rounded-1.5 border border-border bg-muted"
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
          <div className="flex shrink-0 items-center gap-0.5">
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
        <MergeFileStatus
          entry={entry}
          disabled={disabled}
          maxPagesPerFile={maxPagesPerFile}
          onRetry={onRetry}
        />
      </div>
    </>
  );
}

function MergeFileStatus({
  entry,
  disabled,
  maxPagesPerFile,
  onRetry,
}: {
  entry: WorkspaceFile;
  disabled: boolean;
  maxPagesPerFile: number | null;
  onRetry: (id: string) => void;
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
