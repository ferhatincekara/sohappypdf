"use client";

import { useTranslations } from "next-intl";
import { Suspense, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_PATHS } from "@/features/app-shell";
import { DEVELOPER_PATHS } from "@/features/developer-docs";
import { Link } from "@/lib/i18n/navigation";
import { useBillingActions } from "../hooks/use-billing-actions";
import { useBillingStatus } from "../hooks/use-billing-status";
import { useCheckoutReturn } from "../hooks/use-checkout-return";
import { isCheckoutActivationPending } from "../lib/checkout-activation";
import { formatBytes } from "../lib/format-bytes";
import type { CheckoutProductKey, PublicBillingStatus } from "../types/billing";

type BillingSection = "web" | "api";

function BillingWorkspaceInner() {
  const t = useTranslations("billing");
  const tErrors = useTranslations("billing.errors");
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
  const [section, setSection] = useState<BillingSection>("web");

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
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={section === "web" ? "default" : "outline"}
          onClick={() => {
            setSection("web");
          }}
        >
          {t("sections.web")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={section === "api" ? "default" : "outline"}
          onClick={() => {
            setSection("api");
          }}
        >
          {t("sections.api")}
        </Button>
      </div>
      {section === "web" ? (
        <WebPlanSection
          billing={billing}
          isCheckoutPending={isCheckoutPending}
          isPortalPending={isPortalPending}
          onUpgrade={() => {
            void startCheckout("pro");
          }}
          onManage={() => {
            void openPortal();
          }}
        />
      ) : (
        <ApiUsageSection
          billing={billing}
          isCheckoutPending={isCheckoutPending}
          isPortalPending={isPortalPending}
          onCheckout={(product) => {
            void startCheckout(product);
          }}
          onManage={() => {
            void openPortal();
          }}
        />
      )}
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

function WebPlanSection({
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
                onClick={onUpgrade}
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
                onClick={onManage}
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
        <p className="text-xs text-muted-foreground">
          {t("period", {
            start: billing.usage.periodStart.slice(0, 10),
            end: billing.usage.periodEnd.slice(0, 10),
          })}
        </p>
      </section>
    </>
  );
}

function ApiUsageSection({
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
  const subscribeProducts = billing.api.availableProducts.filter(
    (product) => product !== "api-pack" && product !== "pro",
  );

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
          <div className="flex flex-wrap gap-2">
            {billing.canManage ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPortalPending}
                aria-busy={isPortalPending}
                onClick={onManage}
              >
                {isPortalPending ? t("openingPortal") : t("manage")}
              </Button>
            ) : null}
          </div>
        </div>
        <UsageRow
          label={t("api.credits")}
          value={`${billing.api.creditsRemaining} / ${billing.api.creditsLimit}`}
        />
        <p className="text-xs text-muted-foreground">
          {t("period", {
            start: billing.api.periodStart.slice(0, 10),
            end: billing.api.periodEnd.slice(0, 10),
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
                {tApiProducts(
                  product === "api-starter"
                    ? "starter"
                    : product === "api-growth"
                      ? "growth"
                      : "scale",
                )}
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
            <UsageRow
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
