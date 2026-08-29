import { describe, expect, test } from "bun:test";
import {
  API_PACK_MONTHLY_PRICE_USD,
  DEFAULT_API_CREDIT_PACKS,
  DEFAULT_PLAN_LIMITS,
  fallbackCatalogPrices,
  PLAN_IDS,
} from "@sohappypdf/billing/plans";
import { getPublicApiPacks } from "@/features/marketing/lib/public-api-packs";
import {
  countPremiumCatalogTools,
  getPublicPlans,
} from "@/features/marketing/lib/public-plans";

describe("public plans", () => {
  test("renders the centralized Free and Pro catalog", () => {
    const plans = getPublicPlans();

    expect(plans.map((plan) => plan.id)).toEqual([...PLAN_IDS]);

    for (const plan of plans) {
      const source = DEFAULT_PLAN_LIMITS[plan.id];

      expect(plan.monthlyConversions).toBe(source.monthlyConversions);
      expect(plan.operationsPerDay).toBe(source.operationsPerDay);
      expect(plan.maxFilesPerOperation).toBe(source.maxFilesPerOperation);
      expect(plan.maxPagesPerFile).toBe(source.maxPagesPerFile);
      expect(plan.monthlyWebCredits).toBe(source.monthlyWebCredits);
      expect(plan.monthlyAiCredits).toBe(source.monthlyAiCredits);
      expect(plan.storageBytes).toBe(source.storageBytes);
      expect(plan.maxFileSizeBytes).toBe(source.maxFileSizeBytes);
      expect(plan.maxApiKeys).toBe(source.maxApiKeys);
      expect(plan.apiRequestsPerMinute).toBe(source.apiRequestsPerMinute);
      expect(plan.apiAccess).toBe(source.apiAccess);
      expect(plan.limits).toEqual(source);
    }

    expect(plans.find((plan) => plan.id === "free")?.monthlyPriceUsd).toBe(0);
    expect(plans.find((plan) => plan.id === "pro")?.monthlyPriceUsd).toBe(5);
  });

  test("uses Polar catalog amounts when they are available", () => {
    const plans = getPublicPlans({
      ...fallbackCatalogPrices(),
      pro: { monthlyUsd: 12, yearlyUsd: null },
    });
    const packs = getPublicApiPacks({
      ...fallbackCatalogPrices(),
      starter: { monthlyUsd: 15, yearlyUsd: 144 },
    });

    expect(plans.find((plan) => plan.id === "pro")?.monthlyPriceUsd).toBe(12);
    expect(packs[0]?.monthlyPriceUsd).toBe(15);
    expect(packs[0]?.yearlyPriceUsd).toBe(144);
  });

  test("does not invent unlimited usage or Polar internals", () => {
    const serialized = JSON.stringify(getPublicPlans());

    expect(serialized.toLowerCase()).not.toContain("unlimited");
    expect(serialized).not.toContain("polar");
    expect(serialized).not.toContain("customer");
    expect(serialized).not.toContain("subscriptionId");
  });

  test("counts premium tools from the catalog, not UI copy", () => {
    expect(countPremiumCatalogTools()).toBeGreaterThanOrEqual(10);
  });
});

describe("public API packs", () => {
  test("renders centralized API credit pack sizes", () => {
    const packs = getPublicApiPacks();

    expect(packs.map((pack) => pack.id)).toEqual([
      "starter",
      "growth",
      "scale",
    ]);
    expect(packs[0]?.monthlyApiCredits).toBe(DEFAULT_API_CREDIT_PACKS.starter);
    expect(packs[1]?.monthlyApiCredits).toBe(DEFAULT_API_CREDIT_PACKS.growth);
    expect(packs[2]?.monthlyApiCredits).toBe(DEFAULT_API_CREDIT_PACKS.scale);
    expect(packs[0]?.monthlyPriceUsd).toBe(API_PACK_MONTHLY_PRICE_USD.starter);
    expect(packs[1]?.monthlyPriceUsd).toBe(API_PACK_MONTHLY_PRICE_USD.growth);
    expect(packs[2]?.monthlyPriceUsd).toBe(API_PACK_MONTHLY_PRICE_USD.scale);
    expect(packs[0]?.yearlyPriceUsd).toBe(86);
    expect(packs[1]?.yearlyPriceUsd).toBe(278);
    expect(packs[2]?.yearlyPriceUsd).toBe(950);
  });
});
