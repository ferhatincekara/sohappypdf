import { describe, expect, test } from "bun:test";
import {
  ANONYMOUS_WEB_LIMITS,
  DEFAULT_API_CREDIT_PACKS,
  DEFAULT_PLAN_LIMITS,
  PLAN_IDS,
} from "@repo/billing/plans";
import { getPublicApiPacks } from "./public-api-packs";
import {
  countPremiumCatalogTools,
  getAnonymousPricingPresentation,
  getPublicPlans,
} from "./public-plans";

describe("public plans", () => {
  test("renders the centralized Free and Pro catalog", () => {
    const plans = getPublicPlans();

    expect(plans.map((plan) => plan.id)).toEqual([...PLAN_IDS]);

    for (const plan of plans) {
      const source = DEFAULT_PLAN_LIMITS[plan.id];

      expect(plan.monthlyConversions).toBe(source.monthlyConversions);
      expect(plan.monthlyWebCredits).toBe(source.monthlyWebCredits);
      expect(plan.monthlyAiCredits).toBe(source.monthlyAiCredits);
      expect(plan.storageBytes).toBe(source.storageBytes);
      expect(plan.maxFileSizeBytes).toBe(source.maxFileSizeBytes);
      expect(plan.maxApiKeys).toBe(source.maxApiKeys);
      expect(plan.apiRequestsPerMinute).toBe(source.apiRequestsPerMinute);
      expect(plan.apiAccess).toBe(source.apiAccess);
      expect(plan.limits).toEqual(source);
    }
  });

  test("does not invent unlimited usage or Polar internals", () => {
    const serialized = JSON.stringify(getPublicPlans());

    expect(serialized.toLowerCase()).not.toContain("unlimited");
    expect(serialized).not.toContain("polar");
    expect(serialized).not.toContain("customer");
    expect(serialized).not.toContain("subscriptionId");
  });

  test("presents anonymous web limits from centralized entitlements", () => {
    const anonymous = getAnonymousPricingPresentation();

    expect(anonymous.maxFilesPerOperation).toBe(
      ANONYMOUS_WEB_LIMITS.maxFilesPerOperation,
    );
    expect(anonymous.operationsPerHour).toBe(
      ANONYMOUS_WEB_LIMITS.operationsPerHour,
    );
    expect(anonymous.retentionHours).toBe(ANONYMOUS_WEB_LIMITS.retentionHours);
    expect(anonymous.maxFileSizeLabel).toContain("MB");
  });

  test("counts premium tools from the catalog, not UI copy", () => {
    expect(countPremiumCatalogTools()).toBeGreaterThan(0);
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
  });
});
