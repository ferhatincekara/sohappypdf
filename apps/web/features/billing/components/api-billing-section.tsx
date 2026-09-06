"use client";

import { DEFAULT_API_CREDIT_PACKS } from "@sohappypdf/billing/plans";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { APP_PATHS } from "@/features/app-shell";
import { ApiPackSwitchDialog } from "@/features/billing/components/api-pack-switch-dialog";
import { BillingCreditHistoryList } from "@/features/billing/components/billing-credit-history-list";
import { BillingOfferCard } from "@/features/billing/components/billing-offer-card";
import {
  BillingPlanHero,
  BillingSectionCard,
  billingStatGridClassName,
} from "@/features/billing/components/billing-plan-hero";
import { BillingStat } from "@/features/billing/components/billing-stat";
import { PolarPortalActions } from "@/features/billing/components/polar-portal-actions";
import {
  apiPackCheckoutAction,
  apiPackRenewalDate,
  apiProductLabelKey,
  apiSubscribeProducts,
  billingHeroInterval,
  canOpenApiPolarPortal,
  catalogPriceForCycle,
  formatUsdAmount,
  isSelectedApiOfferPack,
  resolveBillingPlanNotice,
} from "@/features/billing/lib/billing-view";
import { formatBillingDisplayDate } from "@/features/billing/lib/format-billing-date";
import type {
  BillingInterval,
  CheckoutProductKey,
  PublicBillingStatus,
} from "@/features/billing/types/billing";
import { DEVELOPER_PATHS } from "@/features/developer-docs";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

export function ApiBillingSection({
  billing,
  cycle,
  isCheckoutPending,
  isPortalPending,
  onCheckout,
  onManage,
}: {
  billing: PublicBillingStatus;
  cycle: BillingInterval;
  isCheckoutPending: boolean;
  isPortalPending: boolean;
  onCheckout: (product: CheckoutProductKey) => void;
  onManage: () => void;
}) {
  const t = useTranslations("billing");
  const tApi = useTranslations("billing.api");
  const tApiProducts = useTranslations("billing.apiProducts");
  const tStatus = useTranslations("billing.subscriptionStatus");
  const locale = useLocale();
  const subscribeProducts = apiSubscribeProducts(billing.api.availableProducts);
  const [pendingSwitch, setPendingSwitch] = useState<CheckoutProductKey | null>(
    null,
  );
  const pendingPackId =
    pendingSwitch === null ? null : apiProductLabelKey(pendingSwitch);
  const pendingOffer =
    pendingPackId === null
      ? null
      : catalogPriceForCycle(billing.prices[pendingPackId], cycle);
  const packId = billing.api.product;
  const hasPack = packId !== null;
  const currentCheckoutProduct =
    packId === null
      ? null
      : (subscribeProducts.find(
          (product) => apiProductLabelKey(product) === packId,
        ) ?? null);
  const canSwitchInterval =
    hasPack &&
    billing.api.interval !== null &&
    billing.api.interval !== cycle &&
    currentCheckoutProduct !== null;
  const packOffer =
    packId === null
      ? null
      : catalogPriceForCycle(
          billing.prices[packId],
          billingHeroInterval({
            paid: true,
            subscribed: billing.api.interval,
            selected: cycle,
          }),
        );
  const notice = resolveBillingPlanNotice({
    paid: hasPack,
    cancelAtPeriodEnd: false,
    periodEnd: apiPackRenewalDate(billing.api),
    subscriptionStatus: billing.api.subscriptionStatus,
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

  return (
    <div className="flex flex-col gap-8">
      {hasPack && packOffer !== null ? (
        <BillingPlanHero
          title={tApiProducts(packId)}
          value={formatUsdAmount(packOffer.amount)}
          unit={packOffer.interval === "yearly" ? t("perYear") : t("perMonth")}
          description={description}
          paid
          actions={
            <>
              {canSwitchInterval && currentCheckoutProduct !== null ? (
                <Button
                  type="button"
                  disabled={isCheckoutPending}
                  aria-busy={isCheckoutPending}
                  onClick={() => {
                    onCheckout(currentCheckoutProduct);
                  }}
                >
                  {isCheckoutPending
                    ? t("switchingInterval")
                    : cycle === "yearly"
                      ? t("switchToYearly")
                      : t("switchToMonthly")}
                </Button>
              ) : null}
              <PolarPortalActions
                canManage={canOpenApiPolarPortal(billing.api)}
                isPortalPending={isPortalPending}
                onManage={onManage}
                tone="onDark"
              />
            </>
          }
        />
      ) : null}

      <BillingSectionCard
        title={t("usage")}
        description={
          hasPack
            ? t("period", {
                start: formatBillingDisplayDate(
                  billing.api.periodStart,
                  locale,
                ),
                end: formatBillingDisplayDate(billing.api.periodEnd, locale),
              })
            : tApi("includedHint", {
                count: billing.api.creditsLimit,
              })
        }
        meta={tApi("creditsResetOn", {
          date: formatBillingDisplayDate(billing.api.periodEnd, locale),
        })}
      >
        <dl className={cn(billingStatGridClassName, "sm:grid-cols-3")}>
          <BillingStat
            label={t("api.credits")}
            value={t("usedOfLimit", {
              used: billing.api.creditsUsed,
              limit: billing.api.creditsLimit,
            })}
          />
          <BillingStat
            label={t("remainingLabel")}
            value={t("remaining", {
              count: billing.api.creditsRemaining,
            })}
          />
          <BillingStat
            label={tApi("resetLabel")}
            value={formatBillingDisplayDate(billing.api.periodEnd, locale)}
          />
        </dl>
      </BillingSectionCard>

      {subscribeProducts.length > 0 ? (
        <BillingSectionCard title={tApi("plans")}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subscribeProducts.map((product) => {
              const offerPackId = apiProductLabelKey(product);
              const isCurrent = isSelectedApiOfferPack(
                billing.api.product,
                product,
                billing.api.interval,
                cycle,
              );
              const offer = catalogPriceForCycle(
                billing.prices[offerPackId],
                isCurrent
                  ? billingHeroInterval({
                      paid: true,
                      subscribed: billing.api.interval,
                      selected: cycle,
                    })
                  : cycle,
              );
              const action = apiPackCheckoutAction(
                billing.api.product,
                product,
                billing.api.interval,
                cycle,
              );

              return (
                <BillingOfferCard
                  key={product}
                  title={tApiProducts(offerPackId)}
                  subtitle={tApi("packCredits", {
                    count: DEFAULT_API_CREDIT_PACKS[offerPackId],
                  })}
                  price={formatUsdAmount(offer.amount)}
                  unit={
                    offer.interval === "yearly" ? t("perYear") : t("perMonth")
                  }
                  actionLabel={tApi(action)}
                  isCurrent={isCurrent}
                  isPending={isCheckoutPending}
                  cta={action}
                  onClick={() => {
                    if (action === "switch") {
                      setPendingSwitch(product);
                      return;
                    }

                    onCheckout(product);
                  }}
                />
              );
            })}
          </div>
          <ApiPackSwitchDialog
            open={pendingSwitch !== null}
            packName={pendingPackId === null ? "" : tApiProducts(pendingPackId)}
            price={pendingOffer?.amount ?? 0}
            unit={
              pendingOffer?.interval === "yearly" ? t("perYear") : t("perMonth")
            }
            isPending={isCheckoutPending}
            onOpenChange={(open) => {
              if (!open) {
                setPendingSwitch(null);
              }
            }}
            onConfirm={() => {
              if (pendingSwitch === null) {
                return;
              }

              const product = pendingSwitch;
              setPendingSwitch(null);
              onCheckout(product);
            }}
          />
        </BillingSectionCard>
      ) : null}

      <BillingSectionCard
        title={tApi("recentUsage")}
        actions={
          <>
            <Button
              variant="white"
              nativeButton={false}
              render={<Link href={DEVELOPER_PATHS.docs} />}
            >
              {tApi("documentation")}
            </Button>
            <Button
              nativeButton={false}
              render={<Link href={APP_PATHS.apiKeys} />}
            >
              {tApi("manageKeys")}
            </Button>
          </>
        }
      >
        <p className="mb-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {tApi("recentUsageHint")}
        </p>
        <BillingCreditHistoryList entries={billing.api.recentUsage} />
      </BillingSectionCard>
    </div>
  );
}
