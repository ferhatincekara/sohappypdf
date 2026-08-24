import type { CheckoutProductKey, PublicBillingStatus } from "../types/billing";

export const BILLING_CENTER_SECTIONS = ["web", "api", "ai"] as const;

export type BillingCenterSection = (typeof BILLING_CENTER_SECTIONS)[number];

export type BillingCenterFlags = {
  canOpenDashboard: boolean;
  isFree: boolean;
  isPro: boolean;
  hasApiPlan: boolean;
  hasAi: boolean;
};

export function canOpenBillingDashboard(isAuthenticated: boolean): boolean {
  return isAuthenticated;
}

export function hasAiBilling(
  usage: Pick<
    PublicBillingStatus["usage"],
    "aiCreditsLimit" | "aiCreditsRemaining"
  >,
): boolean {
  return usage.aiCreditsLimit > 0 || usage.aiCreditsRemaining > 0;
}

export function hasApiBilling(
  api: Pick<PublicBillingStatus["api"], "product" | "creditsLimit">,
): boolean {
  return api.product !== null || api.creditsLimit > 0;
}

export function listBillingCenterSections(
  billing: Pick<PublicBillingStatus, "usage">,
): readonly BillingCenterSection[] {
  if (hasAiBilling(billing.usage)) {
    return BILLING_CENTER_SECTIONS;
  }

  return ["web", "api"];
}

export function resolveBillingCenterSection(
  requested: BillingCenterSection,
  sections: readonly BillingCenterSection[],
): BillingCenterSection {
  if (sections.includes(requested)) {
    return requested;
  }

  return "web";
}

export function toIsoDate(value: string): string {
  return value.slice(0, 10);
}

export function webPlanRenewalDate(
  billing: Pick<PublicBillingStatus, "plan" | "currentPeriodEnd">,
): string | null {
  if (billing.plan !== "pro" || billing.currentPeriodEnd === null) {
    return null;
  }

  return toIsoDate(billing.currentPeriodEnd);
}

export function webCreditsResetDate(
  billing: Pick<PublicBillingStatus, "usage">,
): string {
  return toIsoDate(billing.usage.periodEnd);
}

export function apiSubscribeProducts(
  availableProducts: readonly CheckoutProductKey[],
): CheckoutProductKey[] {
  return availableProducts.filter(
    (product) => product !== "api-pack" && product !== "pro",
  );
}

export function apiProductLabelKey(
  product: CheckoutProductKey,
): "starter" | "growth" | "scale" {
  if (product === "api-growth") {
    return "growth";
  }

  if (product === "api-scale") {
    return "scale";
  }

  return "starter";
}

export function resolveBillingCenterFlags(input: {
  isAuthenticated: boolean;
  billing: PublicBillingStatus | null;
}): BillingCenterFlags {
  if (!input.isAuthenticated || input.billing === null) {
    return {
      canOpenDashboard: false,
      isFree: false,
      isPro: false,
      hasApiPlan: false,
      hasAi: false,
    };
  }

  return {
    canOpenDashboard: true,
    isFree: input.billing.plan === "free",
    isPro: input.billing.plan === "pro",
    hasApiPlan: hasApiBilling(input.billing.api),
    hasAi: hasAiBilling(input.billing.usage),
  };
}
