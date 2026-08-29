import {
  API_PACK_MONTHLY_PRICE_USD,
  apiPackYearlyPriceUsd,
  type BillingCatalogPrices,
  DEFAULT_API_CREDIT_PACKS,
  fallbackCatalogPrices,
} from "@sohappypdf/billing/plans";

export const PUBLIC_API_PACK_IDS = ["starter", "growth", "scale"] as const;

export type PublicApiPackId = (typeof PUBLIC_API_PACK_IDS)[number];

export type PublicApiPackPresentation = {
  id: PublicApiPackId;
  monthlyApiCredits: number;
  monthlyPriceUsd: number;
  yearlyPriceUsd: number;
};

export function getPublicApiPacks(
  prices: BillingCatalogPrices = fallbackCatalogPrices(),
): readonly PublicApiPackPresentation[] {
  return PUBLIC_API_PACK_IDS.map((id) => {
    const monthlyPriceUsd =
      prices[id].monthlyUsd ?? API_PACK_MONTHLY_PRICE_USD[id];
    const yearlyPriceUsd =
      prices[id].yearlyUsd ?? apiPackYearlyPriceUsd(monthlyPriceUsd);

    return {
      id,
      monthlyApiCredits: DEFAULT_API_CREDIT_PACKS[id],
      monthlyPriceUsd,
      yearlyPriceUsd,
    };
  });
}
