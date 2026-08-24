"use client";

import { useFormatter, useTranslations } from "next-intl";
import { FileDownloadButton } from "@/features/files/components/file-download-button";
import { Link } from "@/lib/i18n/navigation";
import {
  canDownloadConversion,
  isConversionExpired,
} from "../lib/can-download-conversion";
import { conversionFormatLabel } from "../lib/format-label";
import { conversionPath } from "../paths";
import type { PublicConversion } from "../types/conversion";

export function ConversionListItem({
  conversion,
}: {
  conversion: PublicConversion;
}) {
  const t = useTranslations("conversions.history");
  const tStatus = useTranslations("conversions.status");
  const tFormats = useTranslations("conversions.form.formats");
  const formatter = useFormatter();
  const filename = conversion.sourceFilename ?? t("unnamedSource");
  const outputFileId = conversion.outputFileId;
  const expired = isConversionExpired(conversion);
  const canDownload = canDownloadConversion(conversion);
  const statusLabel = expired ? tStatus("expired") : tStatus(conversion.status);

  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {filename}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("summary", {
            source: conversionFormatLabel(conversion.sourceFormat, tFormats),
            target: conversionFormatLabel(conversion.targetFormat, tFormats),
          })}
          <span aria-hidden="true"> · </span>
          {statusLabel}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("created", {
            date: formatter.dateTime(new Date(conversion.createdAt), {
              dateStyle: "medium",
              timeStyle: "short",
            }),
          })}
          {conversion.completedAt === null ? null : (
            <>
              <span aria-hidden="true"> · </span>
              {t("completed", {
                date: formatter.dateTime(new Date(conversion.completedAt), {
                  dateStyle: "medium",
                  timeStyle: "short",
                }),
              })}
            </>
          )}
        </p>
        {expired ? (
          <p className="text-xs text-muted-foreground">{t("expiredHint")}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={conversionPath(conversion.id)}
          className="inline-flex h-8 items-center rounded-md px-2.5 text-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          {t("view")}
        </Link>
        {canDownload && outputFileId !== null ? (
          <FileDownloadButton fileId={outputFileId} variant="outline" />
        ) : null}
      </div>
    </li>
  );
}
