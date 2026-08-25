"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PUBLIC_ANONYMOUS_RETENTION_HOURS } from "../lib/anonymous-limits";
import { isFileWorkspaceUx, type ToolUxState } from "../types/tool-ux-state";

const MOBILE_BAR_CLASS =
  "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden";

export function ToolMobileActionBar({
  ux,
  canProcess,
  processLabel,
  processHint,
  isDownloading,
  downloadLabel,
  resetLabel,
  maxFiles,
  maxFileSizeBytes,
  onProcess,
  onDownload,
  onRetry,
  onReset,
}: {
  ux: ToolUxState;
  canProcess: boolean;
  processLabel: string;
  processHint?: string | null;
  isDownloading: boolean;
  downloadLabel?: string;
  resetLabel?: string;
  maxFiles: number;
  maxFileSizeBytes: number;
  onProcess: () => void;
  onDownload: () => void;
  onRetry: () => void;
  onReset: () => void;
}) {
  const t = useTranslations("publicTools");

  if (ux.status === "empty" || ux.status === "processing") {
    return null;
  }

  if (isFileWorkspaceUx(ux)) {
    return (
      <div className={MOBILE_BAR_CLASS}>
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted-foreground">
              {processHint ??
                t("limits", {
                  files: maxFiles,
                  sizeMb: Math.floor(maxFileSizeBytes / (1024 * 1024)),
                  hours: PUBLIC_ANONYMOUS_RETENTION_HOURS,
                })}
            </p>
          </div>
          <Button
            type="button"
            size="lg"
            className="min-h-12 shrink-0 px-5"
            disabled={!canProcess}
            onClick={onProcess}
          >
            {processLabel}
          </Button>
        </div>
      </div>
    );
  }

  if (ux.status === "success") {
    return (
      <div className={MOBILE_BAR_CLASS}>
        <div className="mx-auto flex w-full max-w-5xl gap-2">
          <Button
            type="button"
            size="lg"
            className="min-h-12 flex-1"
            disabled={isDownloading}
            onClick={onDownload}
          >
            {isDownloading
              ? t("result.downloading")
              : (downloadLabel ?? t("actions.download"))}
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="min-h-12 flex-1"
            onClick={onReset}
          >
            {resetLabel ?? t("actions.startAgain")}
          </Button>
        </div>
      </div>
    );
  }

  if (ux.status === "error") {
    return (
      <div className={MOBILE_BAR_CLASS}>
        <div className="mx-auto flex w-full max-w-5xl gap-2">
          {ux.error.retryable ? (
            <Button
              type="button"
              size="lg"
              className="min-h-12 flex-1"
              onClick={onRetry}
            >
              {t("actions.retry")}
            </Button>
          ) : null}
          <Button
            type="button"
            size="lg"
            variant={ux.error.retryable ? "outline" : "default"}
            className="min-h-12 flex-1"
            onClick={onReset}
          >
            {resetLabel ?? t("actions.startAgain")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={MOBILE_BAR_CLASS}>
      <div className="mx-auto flex w-full max-w-5xl">
        <Button
          type="button"
          size="lg"
          className="min-h-12 w-full"
          onClick={onReset}
        >
          {resetLabel ?? t("actions.startAgain")}
        </Button>
      </div>
    </div>
  );
}
