import type { ApiCreditConfig, ApiProductKey, PolarConfig } from "@repo/config";
import { loadApiCreditConfig } from "@repo/config";

export const CHECKOUT_PRODUCT_KEYS = [
  "pro",
  "api-starter",
  "api-growth",
  "api-scale",
  "api-pack",
] as const;

export type CheckoutProductKey = (typeof CHECKOUT_PRODUCT_KEYS)[number];

export function isCheckoutProductKey(
  value: string,
): value is CheckoutProductKey {
  return CHECKOUT_PRODUCT_KEYS.some((key) => key === value);
}

export function apiProductKeyFromPolarProductId(
  polarProductId: string,
  polar: PolarConfig,
): ApiProductKey | undefined {
  if (
    polar.apiStarterProductId !== undefined &&
    polarProductId === polar.apiStarterProductId
  ) {
    return "starter";
  }

  if (
    polar.apiGrowthProductId !== undefined &&
    polarProductId === polar.apiGrowthProductId
  ) {
    return "growth";
  }

  if (
    polar.apiScaleProductId !== undefined &&
    polarProductId === polar.apiScaleProductId
  ) {
    return "scale";
  }

  return undefined;
}

export function isWebProPolarProduct(
  polarProductId: string,
  polar: PolarConfig,
): boolean {
  return (
    polar.proProductId !== undefined && polarProductId === polar.proProductId
  );
}

export function packCreditsForPolarProduct(
  polarProductId: string,
  polar: PolarConfig,
): number | undefined {
  const pack = polar.apiCreditPacks.find(
    (item) => item.productId === polarProductId,
  );
  return pack?.credits;
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
    case "api-pack":
      return polar.apiCreditPacks[0]?.productId;
  }
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
  if (polar.apiCreditPacks.length > 0) {
    keys.push("api-pack");
  }

  return keys;
}
