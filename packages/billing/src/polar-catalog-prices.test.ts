import { describe, expect, test } from "bun:test";
import type { PolarConfig } from "@sohappypdf/config";
import { fallbackCatalogPrices } from "./default-plan-limits.js";
import {
  applyConfiguredProYearlyPrice,
  collectPolarPriceTargets,
  mergePolarCatalogPrices,
  usdFromPolarProduct,
} from "./polar-catalog-prices.js";

const polar: PolarConfig = {
  accessToken: "token",
  webhookSecret: "secret",
  proProductId: "prod_pro",
  proYearlyProductId: "prod_pro_yearly",
  apiStarterProductId: "prod_starter",
  apiStarterYearlyProductId: "prod_starter_yearly",
  apiGrowthProductId: undefined,
  apiGrowthYearlyProductId: undefined,
  apiScaleProductId: undefined,
  apiScaleYearlyProductId: undefined,
  server: "sandbox",
};

describe("polar catalog prices", () => {
  test("reads fixed Polar prices in cents from camelCase or snake_case", () => {
    expect(
      usdFromPolarProduct({
        prices: [{ amountType: "fixed", priceAmount: 900, isArchived: false }],
      }),
    ).toBe(9);
    expect(
      usdFromPolarProduct({
        prices: [
          { amount_type: "fixed", price_amount: 8600, is_archived: false },
        ],
      }),
    ).toBe(86);
    expect(
      usdFromPolarProduct({
        prices: [
          { amountType: "fixed", priceAmount: 900, isArchived: true },
          { amountType: "fixed", priceAmount: 1200, isArchived: false },
        ],
      }),
    ).toBe(12);
    expect(usdFromPolarProduct({ prices: [] })).toBeUndefined();
    expect(
      usdFromPolarProduct(
        {
          prices: [
            {
              amountType: "fixed",
              priceAmount: 500,
              recurringInterval: "month",
            },
            {
              amountType: "fixed",
              priceAmount: 4800,
              recurringInterval: "year",
            },
          ],
        },
        "yearly",
      ),
    ).toBe(48);
    expect(
      usdFromPolarProduct(
        {
          prices: [
            {
              amountType: "fixed",
              priceAmount: 500,
              recurringInterval: "month",
            },
            {
              amountType: "fixed",
              priceAmount: 4800,
              recurringInterval: "year",
            },
          ],
        },
        "monthly",
      ),
    ).toBe(5);
  });

  test("collects configured Polar product IDs without exposing missing packs", () => {
    expect(
      collectPolarPriceTargets(polar).map((target) => target.offer),
    ).not.toContain("pro");
    expect(collectPolarPriceTargets(polar)).toEqual([
      { offer: "starter", interval: "monthly", productId: "prod_starter" },
      {
        offer: "starter",
        interval: "yearly",
        productId: "prod_starter_yearly",
      },
    ]);
  });

  test("prefers Polar amounts and recomputes yearly when Polar has no yearly product", () => {
    const merged = mergePolarCatalogPrices(fallbackCatalogPrices(), [
      { offer: "starter", interval: "monthly", usd: 12 },
    ]);

    expect(merged.starter.monthlyUsd).toBe(12);
    expect(merged.starter.yearlyUsd).toBe(115);
    expect(merged.pro.monthlyUsd).toBe(0);
  });

  test("keeps Polar yearly amounts when a yearly product is configured", () => {
    const merged = mergePolarCatalogPrices(fallbackCatalogPrices(), [
      { offer: "starter", interval: "monthly", usd: 12 },
      { offer: "starter", interval: "yearly", usd: 86 },
    ]);

    expect(merged.starter.monthlyUsd).toBe(12);
    expect(merged.starter.yearlyUsd).toBe(86);
  });

  test("fills Pro yearly when a yearly Polar product is configured", () => {
    const prices = applyConfiguredProYearlyPrice(
      fallbackCatalogPrices(),
      polar,
    );

    expect(prices.pro.yearlyUsd).toBe(0);
    expect(
      applyConfiguredProYearlyPrice(fallbackCatalogPrices(), {
        ...polar,
        proYearlyProductId: undefined,
      }).pro.yearlyUsd,
    ).toBeNull();
  });
});
