"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  canRetryWorkspaceFileError,
  type PublicToolErrorKey,
  publicToolErrorMessageValues,
} from "@/features/public-tools/lib/public-tool-errors";

export function ToolFileErrorLine({
  errorKey,
  maxPagesPerFile = null,
  disabled,
  onRetry,
}: {
  errorKey: PublicToolErrorKey | null;
  maxPagesPerFile?: number | null;
  disabled: boolean;
  onRetry?: () => void;
}) {
  const t = useTranslations("publicTools");
  const values =
    errorKey === null
      ? {}
      : publicToolErrorMessageValues(errorKey, maxPagesPerFile);
  const message =
    errorKey === null
      ? t("errors.networkFailure")
      : errorKey === "tooManyPages"
        ? t("errors.tooManyPagesShort", values)
        : t(`errors.${errorKey}`, values);

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <p className="text-xs text-muted-foreground">{message}</p>
      {onRetry !== undefined && canRetryWorkspaceFileError(errorKey) ? (
        <Button
          type="button"
          size="xs"
          variant="outline"
          disabled={disabled}
          onClick={onRetry}
        >
          {t("workspace.retry")}
        </Button>
      ) : null}
    </div>
  );
}
