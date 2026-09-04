"use client";

import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  BillingPlanHero,
  BillingSectionCard,
  billingStatGridClassName,
} from "@/features/billing/components/billing-plan-hero";
import { BillingStat } from "@/features/billing/components/billing-stat";
import { PolarPortalActions } from "@/features/billing/components/polar-portal-actions";
import {
  canOpenWebPolarPortal,
  catalogPriceForCycle,
  formatUsdAmount,
  resolveBillingPlanNotice,
  webPlanRenewalDate,
} from "@/features/billing/lib/billing-view";
import { formatBillingDisplayDate } from "@/features/billing/lib/format-billing-date";
import type {
  BillingInterval,
  PublicBillingStatus,
} from "@/features/billing/types/billing";
import { formatFileSize } from "@/features/files/lib/format-file-size";
import { cn } from "@/lib/utils";

export function WebPlanSection({
  billing,
  cycle,
  isCheckoutPending,
  isPortalPending,
  onUpgrade,
  onManage,
}: {
  billing: PublicBillingStatus;
  cycle: BillingInterval;
  isCheckoutPending: boolean;
  isPortalPending: boolean;
  onUpgrade: () => void;
  onManage: () => void;
}) {
  const t = useTranslations("billing");
  const tPlans = useTranslations("billing.plans");
  const tStatus = useTranslations("billing.subscriptionStatus");
  const locale = useLocale();
  const isPro = billing.plan === "pro";
  const operationsLimit = billing.usage.conversionsLimit;
  const webCreditsLimit = billing.usage.webCreditsLimit;
  const notice = resolveBillingPlanNotice({
    paid: isPro,
    cancelAtPeriodEnd: billing.cancelAtPeriodEnd,
    periodEnd: webPlanRenewalDate(billing) ?? billing.currentPeriodEnd,
    subscriptionStatus: billing.subscriptionStatus,
  });
  const description =
    notice.kind === "cancels"
      ? t("cancelsOn", {
          date: formatBillingDisplayDate(notice.date, locale),
        })
      : notice.kind === "renews"
        ? t("renewsOn", {
            date: formatBillingDisplayDate(notice.date, locale),
          })
        : notice.kind === "status"
          ? tStatus(notice.status)
          : undefined;
  const canOpenPolar = canOpenWebPolarPortal(billing);
  const offer = catalogPriceForCycle(
    billing.prices.pro,
    billing.canUpgrade ? cycle : "monthly",
  );

  return (
    <div className="flex flex-col gap-8">
      <BillingPlanHero
        title={tPlans("pro")}
        value={formatUsdAmount(offer.amount)}
        unit={offer.interval === "yearly" ? t("perYear") : t("perMonth")}
        description={description}
        paid={isPro}
        actions={
          billing.canUpgrade || canOpenPolar ? (
            <>
              {billing.canUpgrade ? (
                <Button
                  type="button"
                  disabled={isCheckoutPending}
                  aria-busy={isCheckoutPending}
                  onClick={onUpgrade}
                >
                  {isCheckoutPending ? t("upgrading") : t("upgrade")}
                </Button>
              ) : null}
              <PolarPortalActions
                canManage={canOpenPolar}
                isPortalPending={isPortalPending}
                onManage={onManage}
                tone={isPro ? "onDark" : "default"}
              />
            </>
          ) : undefined
        }
      />

      <BillingSectionCard
        title={t("usage")}
        description={
          billing.plan === "free"
            ? t("includedWebCredits", {
                count: webCreditsLimit,
              })
            : t("period", {
                start: formatBillingDisplayDate(
                  billing.usage.periodStart,
                  locale,
                ),
                end: formatBillingDisplayDate(billing.usage.periodEnd, locale),
              })
        }
        meta={
          billing.plan === "free"
            ? t("creditsResetOn", {
                date: formatBillingDisplayDate(billing.usage.periodEnd, locale),
              })
            : undefined
        }
      >
        <dl className={cn(billingStatGridClassName, "lg:grid-cols-2")}>
          {billing.plan === "free" ? (
            <>
              <BillingStat
                label={t("usageItems.webCredits")}
                value={t("usedOfLimit", {
                  used: billing.usage.webCreditsUsed,
                  limit: webCreditsLimit,
                })}
              />
              <BillingStat
                label={t("remainingLabel")}
                value={t("remaining", {
                  count: billing.usage.webCreditsRemaining,
                })}
              />
              {operationsLimit === null ? null : (
                <BillingStat
                  label={t("usageItems.operations")}
                  value={t("usedOfLimit", {
                    used: billing.usage.conversionsUsed,
                    limit: operationsLimit,
                  })}
                />
              )}
            </>
          ) : (
            <BillingStat
              label={t("usageItems.operations")}
              value={t("unlimited")}
            />
          )}
          <BillingStat
            label={t("usageItems.fileSize")}
            value={formatFileSize(billing.limits.maxFileSizeBytes)}
          />
        </dl>
      </BillingSectionCard>
    </div>
  );
}
