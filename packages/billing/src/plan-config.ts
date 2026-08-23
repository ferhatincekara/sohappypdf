import type { PlanCatalog, PlanLimits } from "./plan-types.js";

const MIB = 1024 * 1024;
const GIB = 1024 * MIB;

export const DEFAULT_PLAN_LIMITS: PlanCatalog = {
  free: {
    monthlyConversions: 20,
    storageBytes: 500 * MIB,
    maxFileSizeBytes: 20 * MIB,
    maxApiKeys: 2,
    apiAccess: true,
    authenticatedRequestsPerMinute: 60,
    apiRequestsPerMinute: 30,
  },
  pro: {
    monthlyConversions: 500,
    storageBytes: 10 * GIB,
    maxFileSizeBytes: 100 * MIB,
    maxApiKeys: 20,
    apiAccess: true,
    authenticatedRequestsPerMinute: 120,
    apiRequestsPerMinute: 60,
  },
};

export function getPlanLimits(
  catalog: PlanCatalog,
  plan: keyof PlanCatalog,
): PlanLimits {
  return catalog[plan];
}
