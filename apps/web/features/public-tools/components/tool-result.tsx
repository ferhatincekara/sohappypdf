"use client";

import { CheckCircle2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { formatLabel } from "../lib/format-labels";

export function ToolResult({
  targetFormat,
  sourceFilename,
  signupHref,
  isAuthenticated,
  isDownloading,
  onDownload,
  onReset,
}: {
  targetFormat: string;
  sourceFilename: string | null;
  signupHref: string;
  isAuthenticated: boolean;
  isDownloading: boolean;
  onDownload: () => void;
  onReset: () => void;
}) {
  const t = useTranslations("publicTools.result");

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
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("description", {
              format: formatLabel(targetFormat),
              source: sourceFilename ?? t("unnamedSource"),
            })}
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              size="lg"
              className="w-full sm:w-auto"
              disabled={isDownloading}
              autoFocus
              onClick={onDownload}
            >
              {isDownloading ? t("downloading") : t("download")}
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={onReset}
            >
              {t("processAnother")}
            </Button>
          </div>
          {isAuthenticated ? null : (
            <p className="mt-4 text-sm text-muted-foreground">
              {t("signupPrompt")}{" "}
              <Link
                href={signupHref}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {t("signupCta")}
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
