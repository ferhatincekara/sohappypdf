"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PillTabs } from "@/components/ui/pill-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiBillingSection } from "@/features/billing/components/api-billing-section";
import { BillingCycleToggle } from "@/features/billing/components/billing-cycle-toggle";
import { WebPlanSection } from "@/features/billing/components/web-plan-section";
import { useBillingActions } from "@/features/billing/hooks/use-billing-actions";
import { useBillingStatus } from "@/features/billing/hooks/use-billing-status";
import { useCheckoutReturn } from "@/features/billing/hooks/use-checkout-return";
import {
  type BillingCenterSection,
  listBillingCenterSections,
  parseBillingCenterSection,
  resolveBillingCenterSection,
  shouldShowBillingCycleToggle,
} from "@/features/billing/lib/billing-view";
import {
  isCheckoutActivationPending,
  resolveCheckoutBanner,
} from "@/features/billing/lib/checkout-activation";
import type { BillingInterval } from "@/features/billing/types/billing";

function BillingWorkspaceInner() {
  const t = useTranslations("billing");
  const tErrors = useTranslations("billing.errors");
  const { phase, dismiss } = useCheckoutReturn();
  const { billing, isLoading, isError, errorKey, refetch } = useBillingStatus({
    pollWhileConfirming: phase === "confirming",
  });
  const { startCheckout, openPortal, isCheckoutPending, isPortalPending } =
    useBillingActions();
  const searchParams = useSearchParams();
  const [requestedSection, setRequestedSection] =
    useState<BillingCenterSection>(() =>
      parseBillingCenterSection(searchParams.get("section")),
    );
  const [cycle, setCycle] = useState<BillingInterval>("monthly");
  const didAnnounceActivation = useRef(false);

  useEffect(() => {
    if (billing === undefined || didAnnounceActivation.current) {
      return;
    }

    if (phase !== "confirming" && phase !== "unconfirmed") {
      return;
    }

    if (isCheckoutActivationPending(billing)) {
      return;
    }

    didAnnounceActivation.current = true;
    toast.success(t("activated"));
    dismiss();
  }, [billing, dismiss, phase, t]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <Skeleton className="h-14 w-48 rounded-full" />
        <Skeleton className="h-48 w-full rounded-7" />
        <Skeleton className="h-40 w-full rounded-7" />
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

  const banner = resolveCheckoutBanner({
    phase,
    pending: isCheckoutActivationPending(billing),
  });
  const sections = listBillingCenterSections();
  const section = resolveBillingCenterSection(requestedSection, sections);
  const showCycle = shouldShowBillingCycleToggle({ section, billing });

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {banner === "confirming" ? (
        <Alert>
          <AlertDescription>{t("activating")}</AlertDescription>
        </Alert>
      ) : null}
      {banner === "unconfirmed" ? (
        <Alert>
          <AlertDescription>{t("unconfirmed")}</AlertDescription>
          <div className="mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void refetch();
              }}
            >
              {t("refreshStatus")}
            </Button>
          </div>
        </Alert>
      ) : null}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <PillTabs
          layoutId="billing-section"
          stretch
          value={section}
          onValueChange={(id) => {
            setRequestedSection(id as BillingCenterSection);
          }}
          items={sections.map((item) => ({
            id: item,
            label: t(`sections.${item}`),
          }))}
        />
        {showCycle ? (
          <BillingCycleToggle value={cycle} onChange={setCycle} />
        ) : null}
      </div>
      {section === "web" ? (
        <WebPlanSection
          billing={billing}
          cycle={cycle}
          isCheckoutPending={isCheckoutPending}
          isPortalPending={isPortalPending}
          onUpgrade={() => {
            startCheckout({ product: "pro", interval: cycle });
          }}
          onManage={() => {
            openPortal();
          }}
        />
      ) : null}
      {section === "api" ? (
        <ApiBillingSection
          billing={billing}
          cycle={cycle}
          isCheckoutPending={isCheckoutPending}
          isPortalPending={isPortalPending}
          onCheckout={(product) => {
            startCheckout({ product, interval: cycle });
          }}
          onManage={() => {
            openPortal();
          }}
        />
      ) : null}
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
