import { describe, expect, test } from "bun:test";
import { DEFAULT_PLAN_LIMITS, PLAN_IDS } from "@repo/billing/plans";
import { getPublicPlans } from "./public-plans";

describe("public plans", () => {
  test("renders the centralized Free and Pro catalog", () => {
    const plans = getPublicPlans();

    expect(plans.map((plan) => plan.id)).toEqual([...PLAN_IDS]);

    for (const plan of plans) {
      const source = DEFAULT_PLAN_LIMITS[plan.id];

      expect(plan.monthlyConversions).toBe(source.monthlyConversions);
      expect(plan.monthlyWebCredits).toBe(source.monthlyWebCredits);
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
});
