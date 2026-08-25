const MIB = 1024 * 1024;
const GIB = 1024 * MIB;

export const DEFAULT_PLAN_LIMITS = {
  free: {
    monthlyConversions: 20,
    monthlyWebCredits: 100,
    monthlyAiCredits: 0,
    storageBytes: 500 * MIB,
    maxFileSizeBytes: 20 * MIB,
    maxApiKeys: 2,
    apiAccess: true,
    authenticatedRequestsPerMinute: 60,
    apiRequestsPerMinute: 30,
  },
  pro: {
    monthlyConversions: 500,
    monthlyWebCredits: 2_000,
    monthlyAiCredits: 200,
    storageBytes: 10 * GIB,
    maxFileSizeBytes: 100 * MIB,
    maxApiKeys: 20,
    apiAccess: true,
    authenticatedRequestsPerMinute: 120,
    apiRequestsPerMinute: 60,
  },
};

export const PLAN_IDS = ["free", "pro"] as const;

export const WEB_TIER_IDS = ["anonymous", "free", "pro"] as const;

export type WebTierId = (typeof WEB_TIER_IDS)[number];

export const ANONYMOUS_WEB_LIMITS = {
  maxFileSizeBytes: DEFAULT_PLAN_LIMITS.free.maxFileSizeBytes,
  maxFilesPerOperation: 5,
  retentionHours: 2,
  operationsPerHour: 10,
  monthlyWebCredits: 0,
  monthlyAiCredits: 0,
} as const;

export const DEFAULT_API_CREDIT_PACKS = {
  starter: 1_000,
  growth: 10_000,
  scale: 100_000,
} as const;

export function resolveWebMaxFileSizeBytes(input: {
  isAuthenticated: boolean;
  planMaxFileSizeBytes?: number | null;
}): number {
  if (!input.isAuthenticated) {
    return ANONYMOUS_WEB_LIMITS.maxFileSizeBytes;
  }

  return (
    input.planMaxFileSizeBytes ?? DEFAULT_PLAN_LIMITS.free.maxFileSizeBytes
  );
}
