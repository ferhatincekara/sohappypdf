"use client";

import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_PATHS } from "@/features/app-shell";
import { Link } from "@/lib/i18n/navigation";
import { useBillingStatus } from "../hooks/use-billing-status";
import { toIsoDate, webCreditsResetDate } from "../lib/billing-view";
import { BillingUsageRow } from "./billing-usage-row";

export function AccountUsageWorkspace() {
  const t = useTranslations("billing");
  const tUsage = useTranslations("appShell.pages.usage");
  const tErrors = useTranslations("billing.errors");
  const { billing, isLoading, isError, errorKey } = useBillingStatus();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || billing === undefined) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {errorKey === null ? tErrors("unexpected") : tErrors(errorKey)}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium text-foreground">
          {tUsage("webCreditsTitle")}
        </h2>
        <BillingUsageRow
          label={t("usageItems.webCredits")}
          value={t("usedOfLimit", {
            used: billing.usage.webCreditsUsed,
            limit: billing.usage.webCreditsLimit,
          })}
        />
        <BillingUsageRow
          label={t("remainingLabel")}
          value={t("remaining", {
            count: billing.usage.webCreditsRemaining,
          })}
        />
        {billing.usage.aiCreditsLimit > 0 ? (
          <BillingUsageRow
            label={t("usageItems.aiCredits")}
            value={t("usedOfLimit", {
              used: billing.usage.aiCreditsUsed,
              limit: billing.usage.aiCreditsLimit,
            })}
          />
        ) : null}
        <p className="text-xs text-muted-foreground">
          {t("creditsResetOn", { date: webCreditsResetDate(billing) })}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("period", {
            start: toIsoDate(billing.usage.periodStart),
            end: toIsoDate(billing.usage.periodEnd),
          })}
        </p>
      </section>
      <p className="text-sm text-muted-foreground">
        {tUsage("billingHint")}{" "}
        <Link
          href={APP_PATHS.billing}
          className="font-medium text-foreground underline underline-offset-4"
        >
          {tUsage("openBilling")}
        </Link>
      </p>
    </div>
  );
}
