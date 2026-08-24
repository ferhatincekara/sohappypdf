"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { APP_PATHS } from "@/features/app-shell";
import { DEVELOPER_PATHS } from "@/features/developer-docs";
import { Link } from "@/lib/i18n/navigation";
import {
  apiProductLabelKey,
  apiSubscribeProducts,
  toIsoDate,
} from "../lib/billing-view";
import type { CheckoutProductKey, PublicBillingStatus } from "../types/billing";
import { BillingUsageRow } from "./billing-usage-row";
import { PolarPortalActions } from "./polar-portal-actions";

export function ApiBillingSection({
  billing,
  isCheckoutPending,
  isPortalPending,
  onCheckout,
  onManage,
}: {
  billing: PublicBillingStatus;
  isCheckoutPending: boolean;
  isPortalPending: boolean;
  onCheckout: (product: CheckoutProductKey) => void;
  onManage: () => void;
}) {
  const t = useTranslations("billing");
  const tApiProducts = useTranslations("billing.apiProducts");
  const tStatus = useTranslations("billing.subscriptionStatus");
  const subscribeProducts = apiSubscribeProducts(billing.api.availableProducts);

  return (
    <>
      <section className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-medium text-foreground">
              {t("api.title")}
            </h2>
            <p className="text-lg font-semibold">
              {billing.api.product === null
                ? t("api.noProduct")
                : tApiProducts(billing.api.product)}
            </p>
            <p className="text-sm text-muted-foreground">
              {billing.api.subscriptionStatus === null
                ? t("api.noSubscription")
                : tStatus(billing.api.subscriptionStatus)}
            </p>
          </div>
          <PolarPortalActions
            canManage={billing.canManage}
            isPortalPending={isPortalPending}
            onManage={onManage}
          />
        </div>
        <BillingUsageRow
          label={t("api.credits")}
          value={t("usedOfLimit", {
            used: billing.api.creditsUsed,
            limit: billing.api.creditsLimit,
          })}
        />
        <BillingUsageRow
          label={t("remainingLabel")}
          value={t("remaining", {
            count: billing.api.creditsRemaining,
          })}
        />
        <p className="text-xs text-muted-foreground">
          {t("period", {
            start: toIsoDate(billing.api.periodStart),
            end: toIsoDate(billing.api.periodEnd),
          })}
        </p>
      </section>
      {subscribeProducts.length > 0 || billing.api.canTopUp ? (
        <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <h2 className="text-sm font-medium text-foreground">
            {t("api.plans")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {subscribeProducts.map((product) => (
              <Button
                key={product}
                type="button"
                size="sm"
                variant="outline"
                disabled={isCheckoutPending}
                aria-busy={isCheckoutPending}
                onClick={() => {
                  onCheckout(product);
                }}
              >
                {tApiProducts(apiProductLabelKey(product))}
              </Button>
            ))}
            {billing.api.canTopUp ? (
              <Button
                type="button"
                size="sm"
                disabled={isCheckoutPending}
                aria-busy={isCheckoutPending}
                onClick={() => {
                  onCheckout("api-pack");
                }}
              >
                {t("api.topUp")}
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}
      <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium text-foreground">
          {t("api.recentUsage")}
        </h2>
        {billing.api.recentUsage.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("api.noUsage")}</p>
        ) : (
          billing.api.recentUsage.map((entry) => (
            <BillingUsageRow
              key={`${entry.createdAt}-${entry.type}-${entry.toolId ?? "none"}`}
              label={`${entry.type}${entry.toolId === null ? "" : ` · ${entry.toolId}`}`}
              value={`${entry.amount}`}
            />
          ))
        )}
      </section>
      <section className="flex flex-col gap-2 text-sm">
        <Link
          href={DEVELOPER_PATHS.docs}
          className="underline underline-offset-4"
        >
          {t("api.documentation")}
        </Link>
        <Link href={APP_PATHS.apiKeys} className="underline underline-offset-4">
          {t("api.manageKeys")}
        </Link>
      </section>
    </>
  );
}
