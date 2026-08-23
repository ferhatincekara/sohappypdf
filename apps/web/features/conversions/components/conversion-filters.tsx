"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import {
  CONVERSION_HISTORY_FILTERS,
  type ConversionHistoryFilter,
  conversionListHref,
} from "../lib/conversion-list-params";

export function ConversionFilters({
  filter,
}: {
  filter: ConversionHistoryFilter;
}) {
  const t = useTranslations("conversions.history.filters");

  return (
    <nav aria-label={t("label")} className="flex flex-wrap gap-2">
      {CONVERSION_HISTORY_FILTERS.map((value) => {
        const active = value === filter;

        return (
          <Link
            key={value}
            href={conversionListHref({ filter: value })}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "rounded-md bg-muted px-2.5 py-1 text-sm font-medium text-foreground"
                : "rounded-md px-2.5 py-1 text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
            }
          >
            {t(value)}
          </Link>
        );
      })}
    </nav>
  );
}
