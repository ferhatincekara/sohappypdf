import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountPageHeader } from "@/features/app-shell";
import { ConversionHistoryWorkspace } from "@/features/conversions/components/conversion-history-workspace";

export async function ConversionHistoryPageContent() {
  const t = await getTranslations("conversions.history");

  return (
    <div className="flex flex-col gap-8">
      <AccountPageHeader title={t("title")} description={t("description")} />
      <Suspense
        fallback={
          <div className="flex flex-col gap-3" aria-busy="true">
            <p className="sr-only">{t("loading")}</p>
            <Skeleton className="h-11 w-72 rounded-full" />
            <Skeleton className="h-20 w-full rounded-md" />
            <Skeleton className="h-20 w-full rounded-md" />
          </div>
        }
      >
        <ConversionHistoryWorkspace />
      </Suspense>
    </div>
  );
}
