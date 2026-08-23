"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_PATHS } from "@/features/app-shell";
import { Link } from "@/lib/i18n/navigation";
import {
  type ConversionHistoryFilter,
  conversionListHref,
} from "../lib/conversion-list-params";
import { conversionListView } from "../lib/conversion-list-view";
import type { PublicConversion } from "../types/conversion";
import { ConversionListItem } from "./conversion-list-item";

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
      <div className="flex flex-col gap-3" aria-busy="true">
        <p className="sr-only">{t("loading")}</p>
        <ConversionListSkeleton />
      </div>
    );
  }

  if (view === "error") {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-destructive">{errorMessage}</p>
        <Button type="button" size="sm" variant="outline" onClick={onRetry}>
          {t("retry")}
        </Button>
      </div>
    );
  }

  if (view === "empty") {
    const isFiltered = filter !== "all";

    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border px-4 py-8">
        <p className="text-sm text-muted-foreground">
          {isFiltered ? t("emptyFiltered") : t("empty")}
        </p>
        <p className="text-sm text-muted-foreground">
          {isFiltered ? t("emptyFilteredHint") : t("emptyHint")}
        </p>
        <Link
          href={
            isFiltered ? conversionListHref({ filter: "all" }) : APP_PATHS.files
          }
          className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          {isFiltered ? t("filters.all") : t("openFiles")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
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

function ConversionListSkeleton() {
  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-card">
      {["one", "two", "three"].map((row) => (
        <div key={row} className="flex flex-col gap-2 px-4 py-3">
          <Skeleton className="h-4 w-52" />
          <Skeleton className="h-3 w-72" />
        </div>
      ))}
    </div>
  );
}
