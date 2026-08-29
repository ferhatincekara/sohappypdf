import { describe, expect, test } from "bun:test";
import { fallbackCatalogPrices } from "@sohappypdf/billing/plans";
import { parseBillingCatalogPrices } from "@/features/marketing/lib/load-public-pricing-catalog";

describe("public pricing catalog", () => {
  test("accepts Polar catalog amounts from the billing API", () => {
    expect(
      parseBillingCatalogPrices({
        prices: {
          pro: { monthlyUsd: 12, yearlyUsd: null },
          starter: { monthlyUsd: 15, yearlyUsd: 144 },
          growth: { monthlyUsd: 29, yearlyUsd: 278 },
          scale: { monthlyUsd: 99, yearlyUsd: 950 },
        },
      }),
    ).toEqual({
      pro: { monthlyUsd: 12, yearlyUsd: null },
      starter: { monthlyUsd: 15, yearlyUsd: 144 },
      growth: { monthlyUsd: 29, yearlyUsd: 278 },
      scale: { monthlyUsd: 99, yearlyUsd: 950 },
    });
  });

  test("rejects incomplete Polar catalogs so fallbacks can be used", () => {
    expect(
      parseBillingCatalogPrices({ prices: { pro: { monthlyUsd: 12 } } }),
    ).toBeUndefined();
    expect(parseBillingCatalogPrices(fallbackCatalogPrices())).toBeUndefined();
  });
});
