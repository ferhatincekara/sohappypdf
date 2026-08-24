"use client";

import { CheckCircle2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { formatLabel } from "../lib/format-labels";
import type { ToolSuccessUxState } from "../types/tool-ux-state";

export function ToolSuccessState({
  state,
  signupHref,
  isAuthenticated,
  isDownloading,
  title,
  description,
  downloadLabel,
  resetLabel,
  onDownload,
  onReset,
}: {
  state: ToolSuccessUxState;
  signupHref: string;
  isAuthenticated: boolean;
  isDownloading: boolean;
  title?: string;
  description?: string;
  downloadLabel?: string;
  resetLabel?: string;
  onDownload: () => void;
  onReset: () => void;
}) {
  const t = useTranslations("publicTools");

  return (
    <div
      className="rounded-lg border border-border bg-card p-5"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <CheckCircle2Icon
          className="mt-0.5 size-5 text-foreground"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-foreground">
            {title ?? t("result.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {description ??
              t("result.description", {
                format: formatLabel(state.targetFormat),
                source: state.sourceFilename ?? t("result.unnamedSource"),
              })}
          </p>
          {state.downloadError !== null ? (
            <p className="mt-2 text-sm text-destructive">
              {t(`errors.${state.downloadError.key}`)}
            </p>
          ) : null}
          <div className="mt-4 hidden flex-col gap-2 sm:flex-row sm:flex-wrap md:flex">
            <Button
              type="button"
              size="lg"
              className="w-full sm:w-auto"
              disabled={isDownloading}
              autoFocus
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
              className="w-full sm:w-auto"
              onClick={onReset}
            >
              {resetLabel ?? t("actions.startAgain")}
            </Button>
          </div>
          {isAuthenticated ? null : (
            <p className="mt-4 text-sm text-muted-foreground">
              {t("result.signupPrompt")}{" "}
              <Link
                href={signupHref}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {t("result.signupCta")}
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
