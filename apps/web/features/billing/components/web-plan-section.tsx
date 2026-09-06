"use client";

import { useLocale, useTranslations } from "next-intl";
import { BillingOfferCard } from "@/features/billing/components/billing-offer-card";
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
  webPlanCheckoutAction,
  webPlanOfferIntervals,
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
  isCheckoutPending,
  isPortalPending,
  onCheckout,
  onManage,
}: {
  billing: PublicBillingStatus;
  isCheckoutPending: boolean;
  isPortalPending: boolean;
  onCheckout: (interval: BillingInterval) => void;
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
  const subscribedOffer = catalogPriceForCycle(
    billing.prices.pro,
    billing.interval ?? "monthly",
  );
  const offerIntervals = webPlanOfferIntervals(billing.prices.pro);

  return (
    <div className="flex flex-col gap-8">
      <BillingPlanHero
        title={isPro ? tPlans("pro") : tPlans("free")}
        value={isPro ? formatUsdAmount(subscribedOffer.amount) : undefined}
        unit={
          isPro
            ? subscribedOffer.interval === "yearly"
              ? t("perYear")
              : t("perMonth")
            : undefined
        }
        description={description}
        paid={isPro}
        actions={
          canOpenPolar ? (
            <PolarPortalActions
              canManage={canOpenPolar}
              isPortalPending={isPortalPending}
              onManage={onManage}
              tone="onDark"
            />
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

      {offerIntervals.length > 0 ? (
        <BillingSectionCard title={t("webPlans")}>
          <div className="grid gap-4 sm:grid-cols-2">
            {offerIntervals.map((interval) => {
              const offer = catalogPriceForCycle(billing.prices.pro, interval);
              const action = webPlanCheckoutAction(billing, interval);
              const cta = action === "upgrade" ? "subscribe" : action;

              return (
                <BillingOfferCard
                  key={interval}
                  title={tPlans("pro")}
                  subtitle={tCycle(interval)}
                  price={formatUsdAmount(offer.amount)}
                  unit={
                    offer.interval === "yearly" ? t("perYear") : t("perMonth")
                  }
                  actionLabel={
                    action === "upgrade"
                      ? t("upgrade")
                      : action === "switch"
                        ? t("api.switch")
                        : t("api.current")
                  }
                  isCurrent={action === "current"}
                  isPending={isCheckoutPending}
                  cta={cta}
                  onClick={() => {
                    onCheckout(interval);
                  }}
                />
              );
            })}
          </div>
        </BillingSectionCard>
      ) : null}
    </div>
  );
}
