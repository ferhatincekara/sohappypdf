"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PUBLIC_ANONYMOUS_RETENTION_HOURS } from "../lib/anonymous-limits";
import type { ToolUxState } from "../types/tool-ux-state";

export function ToolMobileActionBar({
  ux,
  canProcess,
  processLabel,
  isDownloading,
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
  isDownloading: boolean;
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

  if (ux.status === "selected") {
    return (
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted-foreground">
              {t("limits", {
                files: maxFiles,
                sizeMb: Math.floor(maxFileSizeBytes / (1024 * 1024)),
                hours: PUBLIC_ANONYMOUS_RETENTION_HOURS,
              })}
            </p>
          </div>
          <Button
            type="button"
            size="lg"
            className="shrink-0"
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
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
        <div className="mx-auto flex w-full max-w-5xl gap-2">
          <Button
            type="button"
            size="lg"
            className="flex-1"
            disabled={isDownloading}
            onClick={onDownload}
          >
            {isDownloading ? t("result.downloading") : t("actions.download")}
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="flex-1"
            onClick={onReset}
          >
            {t("actions.startAgain")}
          </Button>
        </div>
      </div>
    );
  }

  if (ux.status === "error") {
    return (
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
        <div className="mx-auto flex w-full max-w-5xl gap-2">
          {ux.error.retryable ? (
            <Button
              type="button"
              size="lg"
              className="flex-1"
              onClick={onRetry}
            >
              {t("actions.retry")}
            </Button>
          ) : null}
          <Button
            type="button"
            size="lg"
            variant={ux.error.retryable ? "outline" : "default"}
            className="flex-1"
            onClick={onReset}
          >
            {t("actions.startAgain")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      <div className="mx-auto flex w-full max-w-5xl">
        <Button type="button" size="lg" className="w-full" onClick={onReset}>
          {t("actions.startAgain")}
        </Button>
      </div>
    </div>
  );
}
