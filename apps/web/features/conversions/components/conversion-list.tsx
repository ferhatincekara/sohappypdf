"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConversionListItem } from "@/features/conversions/components/conversion-list-item";
import {
  type ConversionHistoryFilter,
  conversionListHref,
} from "@/features/conversions/lib/conversion-list-params";
import { conversionListView } from "@/features/conversions/lib/conversion-list-view";
import type { PublicConversion } from "@/features/conversions/types/conversion";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";
import { Link } from "@/lib/i18n/navigation";

export function ConversionList({
  conversions,
  filter,
  cursor,
  nextCursor,
  isLoading,
  isError,
  errorMessage,
  onRetry,
}: {
  conversions: PublicConversion[];
  filter: ConversionHistoryFilter;
  cursor?: string;
  nextCursor: string | null;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string;
  onRetry: () => void;
}) {
  const t = useTranslations("conversions.history");
  const view = conversionListView({
    isLoading,
    isError,
    itemCount: conversions.length,
  });

  if (view === "loading") {
    return (
      <div className="flex flex-col gap-2" aria-busy="true">
        <p className="sr-only">{t("loading")}</p>
        <ConversionListSkeleton />
      </div>
    );
  }

  if (view === "error") {
    return (
      <HistoryListPanel role="alert">
        <p className="text-base font-extrabold tracking-tight">
          {errorMessage}
        </p>
        <Button type="button" size="sm" className="mt-4" onClick={onRetry}>
          {t("retry")}
        </Button>
      </HistoryListPanel>
    );
  }

  if (view === "empty") {
    const isFiltered = filter !== "all";

    return (
      <HistoryListPanel>
        <p className="text-base font-extrabold tracking-tight">
          {isFiltered ? t("emptyFiltered") : t("empty")}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {isFiltered ? t("emptyFilteredHint") : t("emptyHint")}
        </p>
        <Button
          className="mt-4"
          nativeButton={false}
          render={
            <Link
              href={
                isFiltered
                  ? conversionListHref({ filter: "all" })
                  : MARKETING_PATHS.tools
              }
            />
          }
        >
          {isFiltered ? t("filters.all") : t("browseTools")}
        </Button>
      </HistoryListPanel>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col gap-2">
        {conversions.map((conversion) => (
          <ConversionListItem key={conversion.id} conversion={conversion} />
        ))}
      </ul>
      {cursor === undefined && nextCursor === null ? null : (
        <div className="flex flex-wrap items-center gap-3">
          {cursor === undefined ? null : (
            <Link
              href={conversionListHref({ filter })}
              className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              {t("firstPage")}
            </Link>
          )}
          {nextCursor === null ? null : (
            <Link
              href={conversionListHref({ filter, cursor: nextCursor })}
              className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              {t("nextPage")}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function HistoryListPanel({
  children,
  role,
}: {
  children: ReactNode;
  role?: "alert";
}) {
  return (
    <div
      role={role}
      className="rounded-3xl bg-muted px-5 py-8 md:px-6 md:py-10"
    >
      {children}
    </div>
  );
}

function ConversionListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {["one", "two", "three"].map((row) => (
        <Skeleton key={row} className="h-20 w-full rounded-md" />
      ))}
    </div>
  );
}
