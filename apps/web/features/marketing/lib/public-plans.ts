import { DEFAULT_PLAN_LIMITS, PLAN_IDS } from "@repo/billing/plans";
import { formatFileSize } from "@/features/files/lib/format-file-size";

export type PublicPlanId = (typeof PLAN_IDS)[number];
export type PublicPlanLimits = (typeof DEFAULT_PLAN_LIMITS)[PublicPlanId];

export type PublicPlanPresentation = {
  id: PublicPlanId;
  monthlyConversions: number;
  storageBytes: number;
  maxFileSizeBytes: number;
  maxApiKeys: number;
  apiRequestsPerMinute: number;
  apiAccess: boolean;
  storageLabel: string;
  maxFileSizeLabel: string;
  limits: PublicPlanLimits;
};

export function presentPlan(
  id: PublicPlanId,
  limits: PublicPlanLimits,
): PublicPlanPresentation {
  return {
    id,
    monthlyConversions: limits.monthlyConversions,
    storageBytes: limits.storageBytes,
    maxFileSizeBytes: limits.maxFileSizeBytes,
    maxApiKeys: limits.maxApiKeys,
    apiRequestsPerMinute: limits.apiRequestsPerMinute,
    apiAccess: limits.apiAccess,
    storageLabel: formatFileSize(limits.storageBytes),
    maxFileSizeLabel: formatFileSize(limits.maxFileSizeBytes),
    limits,
  };
}

export function getPublicPlans(): readonly PublicPlanPresentation[] {
  return PLAN_IDS.map((id) => presentPlan(id, DEFAULT_PLAN_LIMITS[id]));
}
