import {
  type BillingCatalogPrices,
  DEFAULT_PLAN_LIMITS,
  fallbackCatalogPrices,
  PLAN_IDS,
  WEB_PLAN_MONTHLY_PRICE_USD,
} from "@sohappypdf/billing/plans";
import { formatFileSize } from "@/features/files/lib/format-file-size";

export type PublicPlanId = (typeof PLAN_IDS)[number];
export type PublicPlanLimits = (typeof DEFAULT_PLAN_LIMITS)[PublicPlanId];

export type PublicPlanPresentation = {
  id: PublicPlanId;
  monthlyPriceUsd: number;
  monthlyConversions: number | null;
  operationsPerDay: number | null;
  monthlyWebCredits: number;
  monthlyAiCredits: number;
  storageBytes: number;
  maxFileSizeBytes: number;
  maxFilesPerOperation: number | null;
  maxPagesPerFile: number | null;
  hasSupport: boolean;
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
  monthlyPriceUsd: number = WEB_PLAN_MONTHLY_PRICE_USD[id],
): PublicPlanPresentation {
  return {
    id,
    monthlyPriceUsd,
    monthlyConversions: limits.monthlyConversions,
    operationsPerDay: limits.operationsPerDay,
    monthlyWebCredits: limits.monthlyWebCredits,
    monthlyAiCredits: limits.monthlyAiCredits,
    storageBytes: limits.storageBytes,
    maxFileSizeBytes: limits.maxFileSizeBytes,
    maxFilesPerOperation: limits.maxFilesPerOperation,
    maxPagesPerFile: limits.maxPagesPerFile,
    hasSupport: limits.hasSupport,
    maxApiKeys: limits.maxApiKeys,
    apiRequestsPerMinute: limits.apiRequestsPerMinute,
    apiAccess: limits.apiAccess,
    storageLabel: formatFileSize(limits.storageBytes),
    maxFileSizeLabel: formatFileSize(limits.maxFileSizeBytes),
    limits,
  };
}

export function getPublicPlans(
  prices: BillingCatalogPrices = fallbackCatalogPrices(),
): readonly PublicPlanPresentation[] {
  return PLAN_IDS.map((id) =>
    presentPlan(
      id,
      DEFAULT_PLAN_LIMITS[id],
      id === "pro" ? prices.pro.monthlyUsd : WEB_PLAN_MONTHLY_PRICE_USD.free,
    ),
  );
}
