"use client";

import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_PATHS } from "@/features/app-shell";
import { Link } from "@/lib/i18n/navigation";
import { useBillingActions } from "../hooks/use-billing-actions";
import { useBillingStatus } from "../hooks/use-billing-status";
import { useCheckoutReturn } from "../hooks/use-checkout-return";
import { isCheckoutActivationPending } from "../lib/checkout-activation";
import { formatBytes } from "../lib/format-bytes";

function BillingWorkspaceInner() {
  const t = useTranslations("billing");
  const tErrors = useTranslations("billing.errors");
  const tPlans = useTranslations("billing.plans");
  const tStatus = useTranslations("billing.subscriptionStatus");
  const checkoutReturn = useCheckoutReturn();
  const { billing, isLoading, isError, errorKey } = useBillingStatus({
    pollWhileFree: checkoutReturn,
  });
  const {
    startCheckout,
    openPortal,
    isCheckoutPending,
    isPortalPending,
    errorKey: actionErrorKey,
  } = useBillingActions();

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

  const activating = checkoutReturn && isCheckoutActivationPending(billing);

  return (
    <div className="flex flex-col gap-8">
      {activating ? (
        <Alert>
          <AlertDescription>{t("activating")}</AlertDescription>
        </Alert>
      ) : null}
      {actionErrorKey === null ? null : (
        <Alert variant="destructive">
          <AlertDescription>{tErrors(actionErrorKey)}</AlertDescription>
        </Alert>
      )}
      <section className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-medium text-foreground">
              {t("currentPlan")}
            </h2>
            <p className="text-lg font-semibold">{tPlans(billing.plan)}</p>
            <p className="text-sm text-muted-foreground">
              {billing.plan === "free"
                ? t("noSubscription")
                : billing.cancelAtPeriodEnd && billing.currentPeriodEnd !== null
                  ? t("cancelsOn", {
                      date: billing.currentPeriodEnd.slice(0, 10),
                    })
                  : billing.subscriptionStatus === null
                    ? t("noSubscription")
                    : tStatus(billing.subscriptionStatus)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {billing.canUpgrade ? (
              <Button
                type="button"
                size="sm"
                disabled={isCheckoutPending}
                aria-busy={isCheckoutPending}
                onClick={() => {
                  void startCheckout();
                }}
              >
                {isCheckoutPending ? t("upgrading") : t("upgrade")}
              </Button>
            ) : null}
            {billing.canManage ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPortalPending}
                aria-busy={isPortalPending}
                onClick={() => {
                  void openPortal();
                }}
              >
                {isPortalPending ? t("openingPortal") : t("manage")}
              </Button>
            ) : null}
          </div>
        </div>
      </section>
      <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium text-foreground">{t("usage")}</h2>
        <UsageRow
          label={t("usageItems.webCredits")}
          value={`${billing.usage.webCreditsUsed} / ${billing.usage.webCreditsLimit}`}
        />
        <UsageRow
          label={t("usageItems.aiCredits")}
          value={`${billing.usage.aiCreditsUsed} / ${billing.usage.aiCreditsLimit}`}
        />
        <UsageRow
          label={t("usageItems.storage")}
          value={`${formatBytes(billing.usage.storageUsedBytes)} / ${formatBytes(billing.usage.storageLimitBytes)}`}
        />
        <UsageRow
          label={t("usageItems.apiKeys")}
          value={`${billing.usage.apiKeyCount} / ${billing.usage.apiKeyLimit}`}
        />
        <p className="text-xs text-muted-foreground">
          {t("period", {
            start: billing.usage.periodStart.slice(0, 10),
            end: billing.usage.periodEnd.slice(0, 10),
          })}
        </p>
      </section>
      <p className="text-sm text-muted-foreground">
        <Link
          href={APP_PATHS.settings}
          className="underline underline-offset-4"
        >
          {t("backToSettings")}
        </Link>
      </p>
    </div>
  );
}

function UsageRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

export function BillingWorkspace() {
  return (
    <Suspense fallback={<Skeleton className="h-24 w-full" />}>
      <BillingWorkspaceInner />
    </Suspense>
  );
}
