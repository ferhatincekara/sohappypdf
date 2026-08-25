"use client";

import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_PATHS } from "@/features/app-shell";
import { useBillingStatus } from "@/features/billing";
import { formatBytes } from "@/features/billing/lib/format-bytes";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

export function AccountOverviewUsage() {
  const t = useTranslations("appShell.pages.overview");
  const tBilling = useTranslations("billing");
  const tPlans = useTranslations("billing.plans");
  const { billing, isLoading, isError, errorKey } = useBillingStatus();

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
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
    <section className="flex flex-col gap-4 rounded-lg border border-border p-4">
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
        <div className="flex flex-wrap gap-3">
          {billing.canUpgrade ? (
            <Link
              href={APP_PATHS.plan}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              {t("upgrade")}
            </Link>
          ) : null}
          <Link
            href={APP_PATHS.billing}
            className="text-sm font-medium underline underline-offset-4"
          >
            {t("manageBilling")}
          </Link>
        </div>
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <dt className="text-muted-foreground">{t("operations")}</dt>
          <dd>
            {tBilling("usedOfLimit", {
              used: billing.usage.conversionsUsed,
              limit: billing.usage.conversionsLimit,
            })}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-muted-foreground">{t("fileSize")}</dt>
          <dd>{formatBytes(billing.limits.maxFileSizeBytes)}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-muted-foreground">{t("apiStatus")}</dt>
          <dd>
            {t("apiCreditsSummary", {
              remaining: billing.api.creditsRemaining,
              limit: billing.api.creditsLimit,
            })}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-muted-foreground">
            {tBilling("usageItems.apiKeys")}
          </dt>
          <dd>
            {tBilling("usedOfLimit", {
              used: billing.usage.apiKeyCount,
              limit: billing.usage.apiKeyLimit,
            })}
          </dd>
        </div>
      </dl>
    </section>
  );
}
