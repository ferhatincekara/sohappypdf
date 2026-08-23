"use client";

import { FileIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "../lib/format-file-size";
import type { FileUploadState } from "../types/upload-state";
import { FileUploadProgress } from "./file-upload-progress";

export function FileUploadItem({
  state,
  canCancel,
  canRetry,
  onCancel,
  onRetry,
  onReset,
}: {
  state: FileUploadState;
  canCancel: boolean;
  canRetry: boolean;
  onCancel: () => void;
  onRetry: () => void;
  onReset: () => void;
}) {
  const t = useTranslations("files.upload");
  const filename = state.publicFile?.filename ?? state.selectedFile?.name;
  const size = state.publicFile?.size ?? state.selectedFile?.size;

  if (filename === undefined || size === undefined) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
          <FileIcon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {filename}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(size)}
          </p>
        </div>
      </div>

      {state.status === "uploading" || state.status === "finalizing" ? (
        <FileUploadProgress
          progress={state.progress}
          label={
            state.status === "finalizing" ? t("finalizing") : t("uploading")
          }
        />
      ) : null}

      {state.status === "preparing" ? (
        <p className="text-sm text-muted-foreground">{t("preparing")}</p>
      ) : null}

      {state.status === "completed" ? (
        <p className="text-sm font-medium text-foreground">{t("complete")}</p>
      ) : null}

      {state.status === "cancelled" ? (
        <p className="text-sm text-muted-foreground">{t("cancelled")}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {canCancel ? (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            {t("cancel")}
          </Button>
        ) : null}
        {canRetry ? (
          <Button type="button" size="sm" onClick={onRetry}>
            {t("retry")}
          </Button>
        ) : null}
        {state.status === "completed" ||
        state.status === "cancelled" ||
        state.status === "failed" ? (
          <Button
            type="button"
            variant={state.status === "completed" ? "outline" : "ghost"}
            size="sm"
            onClick={onReset}
          >
            {t("chooseAnother")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
