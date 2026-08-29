"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  ConversionActivityRow,
  type ConversionActivityStatusTone,
} from "@/features/conversions/components/conversion-activity-row";
import {
  activityAgeFrom,
  activityAgeLabel,
  activityRemainingFrom,
  activityRemainingLabel,
} from "@/features/conversions/lib/activity-time-copy";
import {
  canDownloadConversion,
  isConversionExpired,
} from "@/features/conversions/lib/can-download-conversion";
import { conversionPath } from "@/features/conversions/paths";
import type {
  ConversionStatus,
  PublicConversion,
} from "@/features/conversions/types/conversion";
import { FileDownloadButton } from "@/features/files/components/file-download-button";
import { Link } from "@/lib/i18n/navigation";

export function ConversionListItem({
  conversion,
}: {
  conversion: PublicConversion;
}) {
  const t = useTranslations("conversions.history");
  const tAge = useTranslations("conversions.history.age");
  const tExpires = useTranslations("conversions.history.expiresIn");
  const tStatus = useTranslations("conversions.status");
  const tTools = useTranslations("tools");
  const filename = conversion.sourceFilename ?? t("unnamedSource");
  const outputFileId = conversion.outputFileId;
  const expired = isConversionExpired(conversion);
  const canDownload = canDownloadConversion(conversion);
  const remaining = activityRemainingFrom(conversion.expiresAt, expired);

  return (
    <ConversionActivityRow
      title={tTools(`${conversion.type}.name`)}
      subtitle={filename}
      statusLabel={historyStatusLabel(conversion.status, expired, tStatus)}
      statusTone={historyStatusTone(conversion.status, expired)}
      createdAt={conversion.createdAt}
      createdLabel={activityAgeLabel(
        activityAgeFrom(conversion.createdAt),
        tAge,
      )}
      expiresAt={conversion.expiresAt}
      expiresLabel={activityRemainingLabel(remaining, tExpires)}
      actions={
        <>
          {canDownload && outputFileId !== null ? (
            <FileDownloadButton fileId={outputFileId} />
          ) : null}
          <Button
            variant="white"
            size="sm"
            nativeButton={false}
            render={<Link href={conversionPath(conversion.id)} />}
          >
            {t("view")}
          </Button>
        </>
      }
    />
  );
}

function historyStatusLabel(
  status: ConversionStatus,
  expired: boolean,
  tStatus: (key: string) => string,
): string {
  if (expired) {
    return tStatus("expired");
  }

  if (status === "failed" || status === "cancelled") {
    return tStatus("failed");
  }

  if (status === "pending" || status === "queued") {
    return tStatus("processing");
  }

  return tStatus(status);
}

function historyStatusTone(
  status: ConversionStatus,
  expired: boolean,
): ConversionActivityStatusTone {
  if (expired) {
    return "neutral";
  }

  if (status === "failed" || status === "cancelled") {
    return "failed";
  }

  if (status === "completed") {
    return "ready";
  }

  return "neutral";
}
