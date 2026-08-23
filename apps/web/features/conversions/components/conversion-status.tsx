"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { APP_PATHS } from "@/features/app-shell";
import { FileDownloadButton } from "@/features/files/components/file-download-button";
import { Link } from "@/lib/i18n/navigation";
import { safeConversionFailureKey } from "../lib/conversion-failure";
import type { PublicConversion } from "../types/conversion";

export function ConversionStatus({
  conversion,
}: {
  conversion: PublicConversion;
}) {
  const t = useTranslations("conversions.status");
  const tTypes = useTranslations("conversions.form.types");
  const tFormats = useTranslations("conversions.form.formats");
  const tFailure = useTranslations("conversions.failure");
  const formatter = useFormatter();

  return (
    <div className="flex flex-col gap-6">
      <div aria-live="polite" className="sr-only">
        {t(conversion.status)}
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-medium text-foreground">
          {t(conversion.status)}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("summary", {
            type: tTypes(conversion.type),
            target: tFormats(conversion.targetFormat),
          })}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatter.dateTime(new Date(conversion.createdAt), {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      </div>

      {conversion.status === "completed" ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-foreground">{t("complete")}</p>
          {conversion.outputFileId === null ? null : (
            <FileDownloadButton fileId={conversion.outputFileId} />
          )}
        </div>
      ) : null}

      {conversion.status === "failed" || conversion.status === "cancelled" ? (
        <Alert variant="destructive">
          <AlertDescription>
            {tFailure(safeConversionFailureKey(conversion.error?.code))}
          </AlertDescription>
        </Alert>
      ) : null}

      {conversion.status === "queued" ||
      conversion.status === "processing" ||
      conversion.status === "pending" ? (
        <p className="text-sm text-muted-foreground">{t("inProgressHint")}</p>
      ) : null}

      <Link
        href={APP_PATHS.files}
        className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
      >
        {t("backToFiles")}
      </Link>
    </div>
  );
}
