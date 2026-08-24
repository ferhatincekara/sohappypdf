"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  toIsoDate,
  webCreditsResetDate,
  webPlanRenewalDate,
} from "../lib/billing-view";
import type { PublicBillingStatus } from "../types/billing";
import { BillingUsageRow } from "./billing-usage-row";
import { PolarPortalActions } from "./polar-portal-actions";

export function WebPlanSection({
  billing,
  isCheckoutPending,
  isPortalPending,
  onUpgrade,
  onManage,
}: {
  billing: PublicBillingStatus;
  isCheckoutPending: boolean;
  isPortalPending: boolean;
  onUpgrade: () => void;
  onManage: () => void;
}) {
  const t = useTranslations("billing");
  const tPlans = useTranslations("billing.plans");
  const tStatus = useTranslations("billing.subscriptionStatus");
  const renewalDate = webPlanRenewalDate(billing);
  const resetDate = webCreditsResetDate(billing);

  return (
    <>
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
                      date: toIsoDate(billing.currentPeriodEnd),
                    })
                  : billing.subscriptionStatus === null
                    ? t("noSubscription")
                    : tStatus(billing.subscriptionStatus)}
            </p>
            {renewalDate === null ? (
              <p className="text-sm text-muted-foreground">
                {t("creditsResetOn", { date: resetDate })}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("renewsOn", { date: renewalDate })}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-3">
            {billing.canUpgrade ? (
              <Button
                type="button"
                size="sm"
                disabled={isCheckoutPending}
                aria-busy={isCheckoutPending}
                onClick={onUpgrade}
              >
                {isCheckoutPending ? t("upgrading") : t("upgrade")}
              </Button>
            ) : null}
            <PolarPortalActions
              canManage={billing.canManage}
              isPortalPending={isPortalPending}
              onManage={onManage}
            />
          </div>
        </div>
      </section>
      <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium text-foreground">{t("usage")}</h2>
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
        <p className="text-xs text-muted-foreground">
          {t("period", {
            start: toIsoDate(billing.usage.periodStart),
            end: toIsoDate(billing.usage.periodEnd),
          })}
        </p>
      </section>
    </>
  );
}
