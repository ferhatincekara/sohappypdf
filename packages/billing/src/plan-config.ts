import {
  type EnvSource,
  loadAiConfig,
  loadWebCreditConfig,
} from "@sohappypdf/config";
import { DEFAULT_PLAN_LIMITS as catalog } from "./default-plan-limits.js";
import type { PlanCatalog, PlanLimits } from "./plan-types.js";

export const DEFAULT_PLAN_LIMITS: PlanCatalog = catalog;

export function buildPlanCatalog(source?: EnvSource): PlanCatalog {
  const webCredits = loadWebCreditConfig(source);
  const aiCredits = loadAiConfig(source);

  return {
    free: {
      ...catalog.free,
      monthlyWebCredits: webCredits.freeMonthlyCredits,
      monthlyAiCredits: aiCredits.freeMonthlyCredits,
    },
    pro: {
      ...catalog.pro,
      monthlyWebCredits: webCredits.proMonthlyCredits,
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
