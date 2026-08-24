"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { APP_PATHS } from "@/features/app-shell";
import { FileDownloadButton } from "@/features/files/components/file-download-button";
import { Link } from "@/lib/i18n/navigation";
import {
  canDownloadConversion,
  isConversionExpired,
} from "../lib/can-download-conversion";
import { safeConversionFailureKey } from "../lib/conversion-failure";
import { conversionFormatLabel } from "../lib/format-label";
import type { PublicConversion } from "../types/conversion";

export function ConversionStatus({
  conversion,
}: {
  conversion: PublicConversion;
}) {
  const t = useTranslations("conversions.status");
  const tHistory = useTranslations("conversions.history");
  const tTypes = useTranslations("conversions.form.types");
  const tFormats = useTranslations("conversions.form.formats");
  const tFailure = useTranslations("conversions.failure");
  const formatter = useFormatter();
  const expired = isConversionExpired(conversion);
  const canDownload = canDownloadConversion(conversion);
  const statusLabel = expired ? t("expired") : t(conversion.status);

  return (
    <div className="flex flex-col gap-6">
      <div aria-live="polite" className="sr-only">
        {statusLabel}
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-medium text-foreground">{statusLabel}</p>
        <p className="truncate text-sm text-foreground">
          {conversion.sourceFilename ?? tHistory("unnamedSource")}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("summary", {
            type: tTypes(conversion.type),
            target: conversionFormatLabel(conversion.targetFormat, tFormats),
          })}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatter.dateTime(new Date(conversion.createdAt), {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      </div>

      {expired ? (
        <Alert>
          <AlertDescription>{t("expiredHint")}</AlertDescription>
        </Alert>
      ) : null}

      {!expired && conversion.status === "completed" ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-foreground">{t("complete")}</p>
          {canDownload && conversion.outputFileId !== null ? (
            <FileDownloadButton fileId={conversion.outputFileId} />
          ) : null}
        </div>
      ) : null}

      {!expired &&
      (conversion.status === "failed" || conversion.status === "cancelled") ? (
        <Alert variant="destructive">
          <AlertDescription>
            {tFailure(safeConversionFailureKey(conversion.error?.code))}
          </AlertDescription>
        </Alert>
      ) : null}

      {!expired &&
      (conversion.status === "queued" ||
        conversion.status === "processing" ||
        conversion.status === "pending") ? (
        <p className="text-sm text-muted-foreground">{t("inProgressHint")}</p>
      ) : null}

      <div className="flex flex-wrap gap-4">
        <Link
          href={APP_PATHS.activity}
          className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          {t("backToHistory")}
        </Link>
        <Link
          href="/tools"
          className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          {t("browseTools")}
        </Link>
      </div>
    </div>
  );
}
