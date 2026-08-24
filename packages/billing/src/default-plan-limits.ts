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
