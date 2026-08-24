"use client";

import { useTranslations } from "next-intl";
import { Suspense, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_PATHS } from "@/features/app-shell";
import { Link } from "@/lib/i18n/navigation";
import { useBillingActions } from "../hooks/use-billing-actions";
import { useBillingStatus } from "../hooks/use-billing-status";
import { useCheckoutReturn } from "../hooks/use-checkout-return";
import {
  type BillingCenterSection,
  listBillingCenterSections,
  resolveBillingCenterSection,
} from "../lib/billing-view";
import { isCheckoutActivationPending } from "../lib/checkout-activation";
import { AiBillingSection } from "./ai-billing-section";
import { ApiBillingSection } from "./api-billing-section";
import { WebPlanSection } from "./web-plan-section";

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
  const [requestedSection, setRequestedSection] =
    useState<BillingCenterSection>("web");

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
  const sections = listBillingCenterSections(billing);
  const section = resolveBillingCenterSection(requestedSection, sections);

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
      <div className="flex flex-wrap gap-2">
        {sections.map((item) => (
          <Button
            key={item}
            type="button"
            size="sm"
            variant={section === item ? "default" : "outline"}
            onClick={() => {
              setRequestedSection(item);
            }}
          >
            {t(`sections.${item}`)}
          </Button>
        ))}
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
      ) : null}
      {section === "api" ? (
        <ApiBillingSection
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
      ) : null}
      {section === "ai" ? <AiBillingSection billing={billing} /> : null}
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

export function BillingWorkspace() {
  return (
    <Suspense fallback={<Skeleton className="h-24 w-full" />}>
      <BillingWorkspaceInner />
    </Suspense>
  );
}
