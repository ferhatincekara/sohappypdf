import {
  ANONYMOUS_WEB_LIMITS,
  DEFAULT_PLAN_LIMITS,
  PLAN_IDS,
} from "@repo/billing/plans";
import { listCatalogTools } from "@repo/tools/catalog";
import { formatFileSize } from "@/features/files/lib/format-file-size";

export type PublicPlanId = (typeof PLAN_IDS)[number];
export type PublicPlanLimits = (typeof DEFAULT_PLAN_LIMITS)[PublicPlanId];

export type PublicPlanPresentation = {
  id: PublicPlanId;
  monthlyConversions: number;
  monthlyWebCredits: number;
  monthlyAiCredits: number;
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
    monthlyWebCredits: limits.monthlyWebCredits,
    monthlyAiCredits: limits.monthlyAiCredits,
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

export type AnonymousPricingPresentation = {
  maxFileSizeLabel: string;
  maxFilesPerOperation: number;
  operationsPerHour: number;
  retentionHours: number;
};

export function getAnonymousPricingPresentation(): AnonymousPricingPresentation {
  return {
    maxFileSizeLabel: formatFileSize(ANONYMOUS_WEB_LIMITS.maxFileSizeBytes),
    maxFilesPerOperation: ANONYMOUS_WEB_LIMITS.maxFilesPerOperation,
    operationsPerHour: ANONYMOUS_WEB_LIMITS.operationsPerHour,
    retentionHours: ANONYMOUS_WEB_LIMITS.retentionHours,
  };
}

export function countPremiumCatalogTools(): number {
  return listCatalogTools().filter(
    (tool) =>
      tool.availableOnPlans.includes("pro") &&
      !tool.availableOnPlans.includes("free") &&
      tool.availability !== "planned",
  ).length;
}
