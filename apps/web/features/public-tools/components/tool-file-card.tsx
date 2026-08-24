"use client";

import { useTranslations } from "next-intl";
import { useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/features/files/lib/format-file-size";
import { fileExtensionLabel, type WorkspaceFile } from "../lib/workspace-files";
import { ToolFilePreview } from "./tool-file-preview";

export function ToolFileCard({
  entry,
  pageCount,
  accept,
  disabled,
  onRemove,
  onReplace,
  onRetry,
}: {
  entry: WorkspaceFile;
  pageCount?: number | null;
  accept: string;
  disabled: boolean;
  onRemove: () => void;
  onReplace: (files: FileList | File[]) => void;
  onRetry: () => void;
}) {
  const t = useTranslations("publicTools");
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const pages = pageCount ?? entry.pageCount;

  return (
    <article className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
      <ToolFilePreview entry={entry} className="size-14" />
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
        {entry.status === "uploading" ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {t("phases.uploading")}
          </p>
        ) : null}
        {entry.status === "failed" ? (
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
              onClick={onRetry}
            >
              {t("workspace.retry")}
            </Button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
