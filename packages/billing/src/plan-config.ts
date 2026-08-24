import { type EnvSource, loadWebCreditConfig } from "@repo/config";
import { DEFAULT_PLAN_LIMITS as catalog } from "./default-plan-limits.js";
import type { PlanCatalog, PlanLimits } from "./plan-types.js";

export const DEFAULT_PLAN_LIMITS: PlanCatalog = catalog;

export function buildPlanCatalog(source?: EnvSource): PlanCatalog {
  const webCredits = loadWebCreditConfig(source);

  return {
    free: {
      ...catalog.free,
      monthlyWebCredits: webCredits.freeMonthlyCredits,
    },
    pro: {
      ...catalog.pro,
      monthlyWebCredits: webCredits.proMonthlyCredits,
    },
  };
}

export function getPlanLimits(
  catalog: PlanCatalog,
  plan: keyof PlanCatalog,
): PlanLimits {
  return catalog[plan];
}
