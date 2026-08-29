"use client";

import { useTranslations } from "next-intl";
import { useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/features/files/lib/format-file-size";
import { ToolFileErrorLine } from "@/features/public-tools/components/tool-file-error-line";
import { ToolFilePreview } from "@/features/public-tools/components/tool-file-preview";
import { ToolFileUploadProgress } from "@/features/public-tools/components/tool-file-upload-progress";
import {
  fileExtensionLabel,
  type WorkspaceFile,
} from "@/features/public-tools/lib/workspace-files";

export function ToolFileCard({
  entry,
  pageCount,
  accept,
  disabled,
  maxPagesPerFile = null,
  onRemove,
  onReplace,
  onRetry,
}: {
  entry: WorkspaceFile;
  pageCount?: number | null;
  accept: string;
  disabled: boolean;
  maxPagesPerFile?: number | null;
  onRemove: () => void;
  onReplace: (files: FileList | File[]) => void;
  onRetry: () => void;
}) {
  const t = useTranslations("publicTools");
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const pages = pageCount ?? entry.pageCount;

  return (
    <article className="flex items-center gap-3 border-b border-border py-3">
      <ToolFilePreview entry={entry} className="size-12" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {entry.file.name}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {fileExtensionLabel(entry.file.name)} ·{" "}
              {formatFileSize(entry.file.size)}
              {pages === null || pages === undefined
                ? null
                : ` · ${t("workspace.pageCount", { count: pages })}`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <input
              id={inputId}
              ref={inputRef}
              type="file"
              className="sr-only"
              accept={accept}
              disabled={disabled}
              onChange={(event) => {
                if (
                  event.target.files !== null &&
                  event.target.files.length > 0
                ) {
                  onReplace(event.target.files);
                }
                event.target.value = "";
              }}
            />
            <Button
              type="button"
              size="xs"
              variant="outline"
              disabled={disabled}
              onClick={() => {
                inputRef.current?.click();
              }}
            >
              {t("workspace.replaceFile")}
            </Button>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              disabled={disabled}
              aria-label={t("workspace.removeFile", { name: entry.file.name })}
              onClick={onRemove}
            >
              {t("workspace.remove")}
            </Button>
          </div>
        </div>
        {entry.status === "inspecting" ? (
          <ToolFileUploadProgress
            percent={0}
            label={t("phases.checkingPages")}
            determinate={false}
          />
        ) : null}
        {entry.status === "uploading" || entry.status === "pending" ? (
          <ToolFileUploadProgress
            percent={entry.progress.percent}
            label={t("phases.uploading")}
            determinate={entry.progress.total > 0}
          />
        ) : null}
        {entry.status === "failed" ? (
          <ToolFileErrorLine
            errorKey={entry.errorKey}
            maxPagesPerFile={maxPagesPerFile}
            disabled={disabled}
            onRetry={onRetry}
          />
        ) : null}
      </div>
    </article>
  );
}
