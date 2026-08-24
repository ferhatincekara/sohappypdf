import { describe, expect, test } from "bun:test";
import { DEFAULT_PLAN_LIMITS, PLAN_IDS } from "./default-plan-limits.js";
import { DEFAULT_PLAN_LIMITS as typedCatalog } from "./plan-config.js";
import { PLANS } from "./plan-types.js";

describe("default plan limits", () => {
  test("keeps the leaf catalog aligned with the typed billing catalog", () => {
    expect([...PLAN_IDS]).toEqual([...PLANS]);
    expect(typedCatalog).toEqual(DEFAULT_PLAN_LIMITS);
  });
});
