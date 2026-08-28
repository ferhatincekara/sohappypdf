"use client";

import { useTranslations } from "next-intl";
import { PillTabs } from "@/components/ui/pill-tabs";
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
    <PillTabs
      layoutId="conversion-filters"
      aria-label={t("label")}
      value={filter}
      items={CONVERSION_HISTORY_FILTERS.map((value) => ({
        id: value,
        label: t(value),
        href: conversionListHref({ filter: value }),
      }))}
    />
  );
}
