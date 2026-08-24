"use client";

import { useTranslations } from "next-intl";
import { toIsoDate } from "../lib/billing-view";
import type { PublicBillingStatus } from "../types/billing";
import { BillingUsageRow } from "./billing-usage-row";

export function AiBillingSection({
  billing,
}: {
  billing: PublicBillingStatus;
}) {
  const t = useTranslations("billing");

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-medium text-foreground">{t("ai.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("ai.description")}</p>
      </div>
      <BillingUsageRow
        label={t("ai.credits")}
        value={t("usedOfLimit", {
          used: billing.usage.aiCreditsUsed,
          limit: billing.usage.aiCreditsLimit,
        })}
      />
      <BillingUsageRow
        label={t("remainingLabel")}
        value={t("remaining", {
          count: billing.usage.aiCreditsRemaining,
        })}
      />
      <p className="text-xs text-muted-foreground">
        {t("period", {
          start: toIsoDate(billing.usage.periodStart),
          end: toIsoDate(billing.usage.periodEnd),
        })}
      </p>
    </section>
  );
}
