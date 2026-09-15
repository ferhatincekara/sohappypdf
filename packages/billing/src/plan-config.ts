import { type EnvSource, loadAiConfig } from "@sohappypdf/config";
import { DEFAULT_PLAN_LIMITS as catalog } from "./default-plan-limits.js";
import type { PlanCatalog, PlanLimits } from "./plan-types.js";

export const DEFAULT_PLAN_LIMITS: PlanCatalog = catalog;

export function buildPlanCatalog(source?: EnvSource): PlanCatalog {
  const aiCredits = loadAiConfig(source);

  return {
    free: {
      ...catalog.free,
      monthlyAiCredits: aiCredits.freeMonthlyCredits,
    },
    pro: {
      ...catalog.pro,
      monthlyAiCredits: aiCredits.proMonthlyCredits,
    },
  };
}

export function getPlanLimits(
  catalog: PlanCatalog,
  plan: keyof PlanCatalog,
): PlanLimits {
  return catalog[plan];
}
