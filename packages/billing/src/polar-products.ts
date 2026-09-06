import type {
  ApiCreditConfig,
  ApiProductKey,
  PolarConfig,
} from "@sohappypdf/config";
import { loadApiCreditConfig } from "@sohappypdf/config";

export const CHECKOUT_PRODUCT_KEYS = [
  "pro",
  "api-starter",
  "api-growth",
  "api-scale",
] as const;

export const BILLING_INTERVALS = ["monthly", "yearly"] as const;

export type CheckoutProductKey = (typeof CHECKOUT_PRODUCT_KEYS)[number];
export type ApiCheckoutProductKey = Exclude<CheckoutProductKey, "pro">;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

function matchesPolarId(
  polarProductId: string,
  ...ids: Array<string | undefined>
): boolean {
  return ids.some((id) => id !== undefined && id === polarProductId);
}

export function isCheckoutProductKey(
  value: string,
): value is CheckoutProductKey {
  return CHECKOUT_PRODUCT_KEYS.some((key) => key === value);
}

export function isBillingInterval(value: string): value is BillingInterval {
  return BILLING_INTERVALS.some((interval) => interval === value);
}

export function isApiCheckoutProductKey(
  value: string,
): value is ApiCheckoutProductKey {
  return value !== "pro" && isCheckoutProductKey(value);
}

export function apiProductKeyFromCheckoutProductKey(
  key: ApiCheckoutProductKey,
): ApiProductKey {
  switch (key) {
    case "api-starter":
      return "starter";
    case "api-growth":
      return "growth";
    case "api-scale":
      return "scale";
  }
}

export function apiProductKeyFromPolarProductId(
  polarProductId: string,
  polar: PolarConfig,
): ApiProductKey | undefined {
  if (
    matchesPolarId(
      polarProductId,
      polar.apiStarterProductId,
      polar.apiStarterYearlyProductId,
    )
  ) {
    return "starter";
  }

  if (
    matchesPolarId(
      polarProductId,
      polar.apiGrowthProductId,
      polar.apiGrowthYearlyProductId,
    )
  ) {
    return "growth";
  }

  if (
    matchesPolarId(
      polarProductId,
      polar.apiScaleProductId,
      polar.apiScaleYearlyProductId,
    )
  ) {
    return "scale";
  }

  return undefined;
}

export function isWebProPolarProduct(
  polarProductId: string,
  polar: PolarConfig,
): boolean {
  return matchesPolarId(
    polarProductId,
    polar.proProductId,
    polar.proYearlyProductId,
  );
}

export function isPolarYearlyProductId(
  polarProductId: string,
  polar: PolarConfig,
): boolean {
  return matchesPolarId(
    polarProductId,
    polar.proYearlyProductId,
    polar.apiStarterYearlyProductId,
    polar.apiGrowthYearlyProductId,
    polar.apiScaleYearlyProductId,
  );
}

export function billingIntervalFromPolarProductId(
  polarProductId: string,
  polar: PolarConfig,
): BillingInterval {
  return isPolarYearlyProductId(polarProductId, polar) ? "yearly" : "monthly";
}

export function monthlyApiCreditsForProduct(
  productKey: ApiProductKey,
  config: ApiCreditConfig = loadApiCreditConfig(),
): number {
  switch (productKey) {
    case "starter":
      return config.starterMonthlyCredits;
    case "growth":
      return config.growthMonthlyCredits;
    case "scale":
      return config.scaleMonthlyCredits;
  }
}

export function polarProductIdForCheckout(
  key: CheckoutProductKey,
  polar: PolarConfig,
): string | undefined {
  switch (key) {
    case "pro":
      return polar.proProductId;
    case "api-starter":
      return polar.apiStarterProductId;
    case "api-growth":
      return polar.apiGrowthProductId;
    case "api-scale":
      return polar.apiScaleProductId;
  }
}

export function polarYearlyProductIdForCheckout(
  key: CheckoutProductKey,
  polar: PolarConfig,
): string | undefined {
  switch (key) {
    case "pro":
      return polar.proYearlyProductId;
    case "api-starter":
      return polar.apiStarterYearlyProductId;
    case "api-growth":
      return polar.apiGrowthYearlyProductId;
    case "api-scale":
      return polar.apiScaleYearlyProductId;
  }
}

export function polarProductIdForInterval(
  key: CheckoutProductKey,
  interval: BillingInterval,
  polar: PolarConfig,
): string | undefined {
  if (interval === "yearly") {
    return (
      polarYearlyProductIdForCheckout(key, polar) ??
      polarProductIdForCheckout(key, polar)
    );
  }

  return polarProductIdForCheckout(key, polar);
}

export function polarCheckoutProductIds(
  key: CheckoutProductKey,
  polar: PolarConfig,
  interval: BillingInterval = "monthly",
): string[] {
  const selected = polarProductIdForInterval(key, interval, polar);
  const alternate = polarProductIdForInterval(
    key,
    interval === "yearly" ? "monthly" : "yearly",
    polar,
  );
  const ids: string[] = [];

  if (selected !== undefined) {
    ids.push(selected);
  }

  if (alternate !== undefined && alternate !== selected) {
    ids.push(alternate);
  }

  return ids;
}

export function polarProductIdForSubscriptionUpdate(
  key: CheckoutProductKey,
  currentPolarProductId: string,
  polar: PolarConfig,
  interval?: BillingInterval,
): string | undefined {
  return polarProductIdForInterval(
    key,
    interval ?? billingIntervalFromPolarProductId(currentPolarProductId, polar),
    polar,
  );
}

export function listConfiguredCheckoutProducts(
  polar: PolarConfig,
): readonly CheckoutProductKey[] {
  const keys: CheckoutProductKey[] = [];

  if (polar.proProductId !== undefined) {
    keys.push("pro");
  }
  if (polar.apiStarterProductId !== undefined) {
    keys.push("api-starter");
  }
  if (polar.apiGrowthProductId !== undefined) {
    keys.push("api-growth");
  }
  if (polar.apiScaleProductId !== undefined) {
    keys.push("api-scale");
  }

  return keys;
}
