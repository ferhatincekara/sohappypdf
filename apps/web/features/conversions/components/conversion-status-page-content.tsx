"use client";

import { useTranslations } from "next-intl";
import { APP_PATHS } from "@/features/app-shell";
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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      {!validId || (isError && !isLoading) ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-destructive">
            {tErrors(errorKey ?? "notFound")}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href={APP_PATHS.conversions}
              className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              {t("backToHistory")}
            </Link>
            <Link
              href={APP_PATHS.files}
              className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              {t("backToFiles")}
            </Link>
          </div>
        </div>
      ) : isLoading || conversion === undefined ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : (
        <ConversionStatus conversion={conversion} />
      )}
    </div>
  );
}
