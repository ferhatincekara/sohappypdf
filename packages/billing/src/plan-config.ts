import { DEFAULT_PLAN_LIMITS as catalog } from "./default-plan-limits.js";
import type { PlanCatalog, PlanLimits } from "./plan-types.js";

export const DEFAULT_PLAN_LIMITS: PlanCatalog = catalog;

export function getPlanLimits(
  catalog: PlanCatalog,
  plan: keyof PlanCatalog,
): PlanLimits {
  return catalog[plan];
}
