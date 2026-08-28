"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountPageHeader, APP_PATHS } from "@/features/app-shell";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";
import { Link } from "@/lib/i18n/navigation";
import { useConversion } from "../hooks/use-conversion";
import { isConversionId } from "../schemas/create-conversion-schema";
import { ConversionStatus } from "./conversion-status";

export function ConversionStatusPageContent({
  conversionId,
}: {
  conversionId: string;
}) {
  const t = useTranslations("conversions.status");
  const tErrors = useTranslations("conversions.errors");
  const validId = isConversionId(conversionId);
  const { conversion, isLoading, isError, errorKey } = useConversion(
    conversionId,
    { enabled: validId },
  );

  return (
    <div className="flex flex-col gap-8">
      <AccountPageHeader title={t("title")} description={t("description")} />

      {!validId || (isError && !isLoading) ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-destructive">
            {tErrors(errorKey ?? "notFound")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={APP_PATHS.activity} />}
            >
              {t("backToHistory")}
            </Button>
            <Button
              nativeButton={false}
              render={<Link href={MARKETING_PATHS.tools} />}
            >
              {t("browseTools")}
            </Button>
          </div>
        </div>
      ) : isLoading || conversion === undefined ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          <p className="sr-only">{t("loading")}</p>
          <Skeleton className="h-64 w-full rounded-7" />
        </div>
      ) : (
        <ConversionStatus conversion={conversion} />
      )}
    </div>
  );
}
