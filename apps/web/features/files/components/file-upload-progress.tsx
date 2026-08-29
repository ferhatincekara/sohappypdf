"use client";

import { useTranslations } from "next-intl";
import { formatUploadProgress } from "@/features/files/lib/format-file-size";
import type { UploadProgress } from "@/features/files/types/upload-state";

export function FileUploadProgress({
  progress,
  label,
}: {
  progress: UploadProgress;
  label: string;
}) {
  const t = useTranslations("files.upload");
  const percentLabel = t("percent", { value: progress.percent });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="font-medium text-foreground">{label}</p>
        <p className="tabular-nums text-muted-foreground">{percentLabel}</p>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.percent}
        aria-valuetext={percentLabel}
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full bg-foreground"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      {progress.total > 0 ? (
        <p className="text-xs text-muted-foreground">
          {formatUploadProgress(progress.loaded, progress.total)}
        </p>
      ) : null}
    </div>
  );
}
