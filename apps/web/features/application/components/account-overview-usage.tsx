"use client";

import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_PATHS } from "@/features/app-shell";
import { useBillingStatus } from "@/features/billing";
import { Link } from "@/lib/i18n/navigation";

export function AccountOverviewUsage() {
  const t = useTranslations("appShell.pages.overview");
  const tBilling = useTranslations("billing");
  const tPlans = useTranslations("billing.plans");
  const { billing, isLoading, isError, errorKey } = useBillingStatus();

  if (isLoading) {
    return <Skeleton className="h-28 w-full" />;
  }

  if (isError || billing === undefined) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {errorKey === null
            ? tBilling("errors.unexpected")
            : tBilling(`errors.${errorKey}`)}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium text-foreground">
            {t("planTitle")}
          </h2>
          <p className="text-lg font-semibold">{tPlans(billing.plan)}</p>
          <p className="text-sm text-muted-foreground">
            {t("creditsSummary", {
              used: billing.usage.webCreditsUsed,
              limit: billing.usage.webCreditsLimit,
              remaining: billing.usage.webCreditsRemaining,
            })}
          </p>
        </div>
        <Link
          href={APP_PATHS.billing}
          className="text-sm font-medium underline underline-offset-4"
        >
          {t("manageBilling")}
        </Link>
      </div>
    </section>
  );
}
