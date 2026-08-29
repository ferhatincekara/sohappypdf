"use client";

import { findRegisteredTool } from "@sohappypdf/tools/catalog";
import { useFormatter, useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { APP_PATHS } from "@/features/app-shell";
import {
  activityRemainingFrom,
  activityRemainingLabel,
} from "@/features/conversions/lib/activity-time-copy";
import {
  canDownloadConversion,
  isConversionExpired,
} from "@/features/conversions/lib/can-download-conversion";
import { safeConversionFailureKey } from "@/features/conversions/lib/conversion-failure";
import { conversionFormatLabel } from "@/features/conversions/lib/format-label";
import type {
  ConversionStatus as ConversionStatusId,
  PublicConversion,
} from "@/features/conversions/types/conversion";
import { FileDownloadButton } from "@/features/files/components/file-download-button";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";
import { Link } from "@/lib/i18n/navigation";

const cardClassName = "rounded-7 bg-muted p-6 shadow-none md:p-7";

export function ConversionStatus({
  conversion,
}: {
  conversion: PublicConversion;
}) {
  const t = useTranslations("conversions.status");
  const tHistory = useTranslations("conversions.history");
  const tTools = useTranslations("tools");
  const tFormats = useTranslations("conversions.form.formats");
  const tExpires = useTranslations("conversions.history.expiresIn");
  const tFailure = useTranslations("conversions.failure");
  const formatter = useFormatter();
  const expired = isConversionExpired(conversion);
  const canDownload = canDownloadConversion(conversion);
  const statusLabel = expired ? t("expired") : t(conversion.status);
  const remaining = activityRemainingFrom(conversion.expiresAt, expired);
  const expiresLabel = expired
    ? t("expired")
    : activityRemainingLabel(remaining, tExpires);
  const toolRoute =
    findRegisteredTool(conversion.type)?.route ?? MARKETING_PATHS.tools;
  const inProgress =
    !expired &&
    (conversion.status === "queued" ||
      conversion.status === "processing" ||
      conversion.status === "pending");
  const failed =
    !expired &&
    (conversion.status === "failed" || conversion.status === "cancelled");

  return (
    <div className="flex flex-col gap-4">
      <div aria-live="polite" className="sr-only">
        {statusLabel}
      </div>

      <Card className={cardClassName}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <Badge variant={statusBadgeVariant(conversion.status, expired)}>
              {statusLabel}
            </Badge>
            <h2 className="truncate text-2xl font-extrabold tracking-tight">
              {conversion.sourceFilename ?? tHistory("unnamedSource")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {tTools(`${conversion.type}.name`)}
            </p>
          </div>
          {canDownload && conversion.outputFileId !== null ? (
            <FileDownloadButton fileId={conversion.outputFileId} />
          ) : null}
        </div>

        <dl
          className={
            expiresLabel === null
              ? "mt-6 grid gap-3 sm:grid-cols-2"
              : "mt-6 grid gap-3 sm:grid-cols-3"
          }
        >
          <ConversionDetailStat
            label={t("started")}
            value={formatter.dateTime(new Date(conversion.createdAt), {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          />
          <ConversionDetailStat
            label={t("output")}
            value={conversionFormatLabel(conversion.targetFormat, tFormats)}
          />
          {expiresLabel === null ? null : (
            <ConversionDetailStat label={t("expires")} value={expiresLabel} />
          )}
        </dl>

        {expired ? (
          <Alert className="mt-6">
            <AlertDescription>{t("expiredHint")}</AlertDescription>
          </Alert>
        ) : null}

        {failed ? (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>
              {tFailure(safeConversionFailureKey(conversion.error?.code))}
            </AlertDescription>
          </Alert>
        ) : null}

        {inProgress ? (
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            {t("inProgressHint")}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3 border-t border-black/10 pt-6">
          <Button
            variant="white"
            nativeButton={false}
            render={<Link href={APP_PATHS.activity} />}
          >
            {t("backToHistory")}
          </Button>
          <Button
            variant="white"
            nativeButton={false}
            render={<Link href={toolRoute} />}
          >
            {t("openTool")}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function ConversionDetailStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md bg-white px-4 py-4">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate text-lg font-extrabold tracking-tight">
        {value}
      </dd>
    </div>
  );
}

function statusBadgeVariant(
  status: ConversionStatusId,
  expired: boolean,
): "secondary" | "destructive" | "muted" {
  if (expired) {
    return "muted";
  }

  if (status === "failed" || status === "cancelled") {
    return "destructive";
  }

  if (status === "completed") {
    return "secondary";
  }

  return "muted";
}
