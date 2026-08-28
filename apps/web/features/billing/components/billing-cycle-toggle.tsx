"use client";

import { API_PACK_YEARLY_DISCOUNT_PERCENT } from "@repo/billing/plans";
import { useTranslations } from "next-intl";
import { PillTabs } from "@/components/ui/pill-tabs";
import type { BillingInterval } from "../types/billing";

export function BillingCycleToggle({
  value,
  onChange,
}: {
  value: BillingInterval;
  onChange: (interval: BillingInterval) => void;
}) {
  const t = useTranslations("billing.cycle");

  return (
    <PillTabs
      layoutId="billing-cycle"
      aria-label={t("label")}
      stretch
      value={value}
      onValueChange={(id) => {
        if (id === "monthly" || id === "yearly") {
          onChange(id);
        }
      }}
      items={[
        { id: "monthly", label: t("monthly") },
        {
          id: "yearly",
          label: (
            <>
              {t("yearly")}
              <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-semibold leading-none text-foreground">
                {t("yearlyDiscount", {
                  percent: API_PACK_YEARLY_DISCOUNT_PERCENT,
                })}
              </span>
            </>
          ),
        },
      ]}
    />
  );
}
