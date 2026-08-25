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

export function AccountPlanWorkspace() {
  const t = useTranslations("appShell.pages.plan");
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
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-medium text-foreground">
              {t("current")}
            </h2>
            <p className="text-lg font-semibold">{tPlans(billing.plan)}</p>
            <p className="text-sm text-muted-foreground">
              {billing.subscriptionStatus === null
                ? t("noSubscription")
                : tBilling(`subscriptionStatus.${billing.subscriptionStatus}`)}
            </p>
          </div>
          {billing.canUpgrade ? (
            <Link
              href={APP_PATHS.billing}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              {t("upgrade")}
            </Link>
          ) : (
            <Link
              href={APP_PATHS.billing}
              className="text-sm font-medium underline underline-offset-4"
            >
              {t("manageBilling")}
            </Link>
          )}
        </div>
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            {tBilling("usageItems.webCredits")}:{" "}
            {tBilling("usedOfLimit", {
              used: billing.usage.webCreditsUsed,
              limit: billing.usage.webCreditsLimit,
            })}
          </li>
          <li>
            {t("fileSize", {
              size: formatBytes(billing.limits.maxFileSizeBytes),
            })}
          </li>
          <li>
            {t("operations", {
              used: billing.usage.conversionsUsed,
              limit: billing.usage.conversionsLimit,
            })}
          </li>
        </ul>
      </section>
      <p className="text-sm text-muted-foreground">{t("billingHint")}</p>
    </div>
  );
}
