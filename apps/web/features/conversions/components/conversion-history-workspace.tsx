"use client";

import { useTranslations } from "next-intl";
import { useConversions } from "../hooks/use-conversions";
import { ConversionFilters } from "./conversion-filters";
import { ConversionList } from "./conversion-list";

export function ConversionHistoryWorkspace() {
  const tErrors = useTranslations("conversions.errors");
  const {
    conversions,
    nextCursor,
    params,
    isLoading,
    isError,
    errorKey,
    refetch,
  } = useConversions();

  return (
    <div className="flex flex-col gap-4">
      <ConversionFilters filter={params.filter} />
      <ConversionList
        conversions={conversions}
        filter={params.filter}
        cursor={params.cursor}
        nextCursor={nextCursor}
        isLoading={isLoading}
        isError={isError}
        errorMessage={
          errorKey === null ? tErrors("unexpected") : tErrors(errorKey)
        }
        onRetry={() => {
          void refetch();
        }}
      />
    </div>
  );
}
