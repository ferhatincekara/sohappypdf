"use client";

import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { BillingOfferCard } from "@/features/billing/components/billing-offer-card";
import {
  BillingPlanHero,
  BillingSectionCard,
  billingStatGridClassName,
} from "@/features/billing/components/billing-plan-hero";
import { BillingStat } from "@/features/billing/components/billing-stat";
import { PolarPortalActions } from "@/features/billing/components/polar-portal-actions";
import {
  billingHeroInterval,
  canOpenWebPolarPortal,
  catalogPriceForCycle,
  formatUsdAmount,
  isCurrentWebPlanInterval,
  listWebPlanOfferIntervals,
  resolveBillingPlanNotice,
  webPlanCheckoutAction,
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
  onUpgrade: (interval: BillingInterval) => void;
  onManage: () => void;
}) {
  const t = useTranslations("billing");
  const tCycle = useTranslations("billing.cycle");
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
    billingHeroInterval({
      paid: isPro,
      subscribed: billing.interval,
      selected: cycle,
    }),
  );
  const offerIntervals = listWebPlanOfferIntervals(billing);
  const showIntervalOffers = offerIntervals.length > 1;
  const checkoutAction = webPlanCheckoutAction(billing, cycle);
  const checkoutLabel =
    checkoutAction === "upgrade"
      ? t("upgrade")
      : cycle === "yearly"
        ? t("switchToYearly")
        : t("switchToMonthly");
  const checkoutPendingLabel =
    checkoutAction === "upgrade" ? t("upgrading") : t("switchingInterval");

  return (
    <div className="flex flex-col gap-8">
      <BillingPlanHero
        title={tPlans("pro")}
        value={formatUsdAmount(offer.amount)}
        unit={offer.interval === "yearly" ? t("perYear") : t("perMonth")}
        description={description}
        paid={isPro}
        actions={
          (!showIntervalOffers && checkoutAction !== "current") ||
          canOpenPolar ? (
            <>
              {!showIntervalOffers && checkoutAction !== "current" ? (
                <Button
                  type="button"
                  disabled={isCheckoutPending}
                  aria-busy={isCheckoutPending}
                  onClick={() => {
                    onUpgrade(cycle);
                  }}
                >
                  {isCheckoutPending ? checkoutPendingLabel : checkoutLabel}
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

      {showIntervalOffers ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {offerIntervals.map((interval) => {
            const intervalOffer = catalogPriceForCycle(
              billing.prices.pro,
              interval,
            );
            const action = webPlanCheckoutAction(billing, interval);
            const isCurrent = isCurrentWebPlanInterval(billing, interval);

            return (
              <BillingOfferCard
                key={interval}
                title={tCycle(interval)}
                subtitle={tPlans("pro")}
                price={formatUsdAmount(intervalOffer.amount)}
                unit={
                  intervalOffer.interval === "yearly"
                    ? t("perYear")
                    : t("perMonth")
                }
                actionLabel={
                  action === "upgrade"
                    ? t("upgrade")
                    : action === "current"
                      ? t("current")
                      : interval === "yearly"
                        ? t("switchToYearly")
                        : t("switchToMonthly")
                }
                isCurrent={isCurrent}
                isPending={isCheckoutPending}
                cta={action === "upgrade" ? "subscribe" : action}
                onClick={() => {
                  onUpgrade(interval);
                }}
              />
            );
          })}
        </div>
      ) : null}

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
