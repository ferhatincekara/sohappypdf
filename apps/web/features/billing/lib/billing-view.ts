import type {
  BillingInterval,
  BillingSubscriptionStatus,
  CatalogOfferPrice,
  CheckoutProductKey,
  PublicBillingStatus,
} from "@/features/billing/types/billing";

export { formatUsdAmount } from "@sohappypdf/billing/plans";

export const BILLING_CENTER_SECTIONS = ["web", "api"] as const;

export type BillingCenterSection = (typeof BILLING_CENTER_SECTIONS)[number];

export type BillingCenterFlags = {
  canOpenDashboard: boolean;
  isFree: boolean;
  isPro: boolean;
  hasApiPlan: boolean;
};

export function canOpenBillingDashboard(isAuthenticated: boolean): boolean {
  return isAuthenticated;
}

export function hasApiBilling(
  api: Pick<PublicBillingStatus["api"], "product" | "creditsLimit">,
): boolean {
  return api.product !== null || api.creditsLimit > 0;
}

export function canOpenWebPolarPortal(
  billing: Pick<PublicBillingStatus, "plan" | "subscriptionStatus">,
): boolean {
  return billing.plan === "pro";
}

export function canOpenApiPolarPortal(
  api: Pick<PublicBillingStatus["api"], "product">,
): boolean {
  return api.product !== null;
}

export function listBillingCenterSections(): readonly BillingCenterSection[] {
  return BILLING_CENTER_SECTIONS;
}

export function isBillingCenterSection(
  value: string | null | undefined,
): value is BillingCenterSection {
  return value === "web" || value === "api";
}

export function parseBillingCenterSection(
  value: string | null | undefined,
): BillingCenterSection {
  return isBillingCenterSection(value) ? value : "web";
}

export function resolveBillingCenterSection(
  requested: string | null | undefined,
  sections: readonly BillingCenterSection[],
): BillingCenterSection {
  const section = parseBillingCenterSection(requested);

  if (sections.includes(section)) {
    return section;
  }

  return "web";
}

export function webPlanRenewalDate(
  billing: Pick<PublicBillingStatus, "plan" | "currentPeriodEnd">,
): string | null {
  if (billing.plan !== "pro" || billing.currentPeriodEnd === null) {
    return null;
  }

  return billing.currentPeriodEnd;
}

export function apiPackRenewalDate(
  api: Pick<PublicBillingStatus["api"], "product" | "periodEnd">,
): string | null {
  if (api.product === null) {
    return null;
  }

  return api.periodEnd;
}

export type BillingPlanNotice =
  | { kind: "included" }
  | { kind: "renews"; date: string }
  | { kind: "cancels"; date: string }
  | { kind: "status"; status: BillingSubscriptionStatus };

export function resolveBillingPlanNotice(input: {
  paid: boolean;
  cancelAtPeriodEnd: boolean;
  periodEnd: string | null;
  subscriptionStatus: BillingSubscriptionStatus | null;
}): BillingPlanNotice {
  if (!input.paid) {
    return { kind: "included" };
  }

  if (input.cancelAtPeriodEnd && input.periodEnd !== null) {
    return { kind: "cancels", date: input.periodEnd };
  }

  if (input.subscriptionStatus === "active" && input.periodEnd !== null) {
    return { kind: "renews", date: input.periodEnd };
  }

  if (input.subscriptionStatus === null) {
    return { kind: "included" };
  }

  return { kind: "status", status: input.subscriptionStatus };
}

export function webCreditsResetDate(
  billing: Pick<PublicBillingStatus, "usage">,
): string {
  return billing.usage.periodEnd;
}

export function apiSubscribeProducts(
  availableProducts: readonly CheckoutProductKey[],
): CheckoutProductKey[] {
  return availableProducts.filter((product) => product !== "pro");
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

export function apiPackCheckoutAction(
  current: PublicBillingStatus["api"]["product"],
  product: CheckoutProductKey,
): "current" | "subscribe" | "switch" {
  if (current === null) {
    return "subscribe";
  }

  if (apiProductLabelKey(product) === current) {
    return "current";
  }

  return "switch";
}

export function isSelectedApiOfferPack(
  current: PublicBillingStatus["api"]["product"],
  product: CheckoutProductKey,
): boolean {
  return current !== null && apiProductLabelKey(product) === current;
}

export function webPlanCheckoutAction(
  billing: Pick<PublicBillingStatus, "canUpgrade" | "interval">,
  cycle: BillingInterval,
): "upgrade" | "switch" | "current" {
  if (billing.canUpgrade) {
    return "upgrade";
  }

  if (billing.interval !== null && billing.interval !== cycle) {
    return "switch";
  }

  return "current";
}

export function subscribedBillingInterval(
  section: BillingCenterSection,
  billing: PublicBillingStatus,
): BillingInterval | null {
  return section === "web" ? billing.interval : billing.api.interval;
}

export function billingHeroInterval(input: {
  paid: boolean;
  subscribed: BillingInterval | null;
  selected: BillingInterval;
}): BillingInterval {
  if (input.paid) {
    return input.subscribed ?? "monthly";
  }

  return input.selected;
}

export function catalogPriceForCycle(
  offer: CatalogOfferPrice,
  interval: BillingInterval,
): { amount: number; interval: BillingInterval } {
  if (interval === "yearly" && offer.yearlyUsd !== null) {
    return { amount: offer.yearlyUsd, interval: "yearly" };
  }

  return { amount: offer.monthlyUsd, interval: "monthly" };
}

export function shouldShowBillingCycleToggle(input: {
  section: BillingCenterSection;
  billing: PublicBillingStatus;
}): boolean {
  if (input.section === "web") {
    return input.billing.prices.pro.yearlyUsd !== null;
  }

  return (
    input.billing.prices.starter.yearlyUsd !== null ||
    input.billing.prices.growth.yearlyUsd !== null ||
    input.billing.prices.scale.yearlyUsd !== null
  );
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
    };
  }

  return {
    canOpenDashboard: true,
    isFree: input.billing.plan === "free",
    isPro: input.billing.plan === "pro",
    hasApiPlan: hasApiBilling(input.billing.api),
  };
}
