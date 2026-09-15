const MIB = 1024 * 1024;
const GIB = 1024 * MIB;

export const FREE_OPERATIONS_PER_DAY = 5;
export const FREE_MAX_FILES_PER_OPERATION = 1;
export const FREE_MAX_PAGES_PER_FILE = 50;
export const FREE_MAX_FILE_SIZE_BYTES = 25 * MIB;
export const PRO_MAX_FILE_SIZE_BYTES = GIB;
export const PRO_MAX_FILES_PER_OPERATION = 20;
export const FILE_RETENTION_HOURS = 2;

export const DEFAULT_PLAN_LIMITS = {
  free: {
    monthlyConversions: 155,
    operationsPerDay: FREE_OPERATIONS_PER_DAY,
    monthlyWebCredits: 0,
    monthlyAiCredits: 0,
    storageBytes: 500 * MIB,
    maxFileSizeBytes: FREE_MAX_FILE_SIZE_BYTES,
    maxFilesPerOperation: FREE_MAX_FILES_PER_OPERATION,
    maxPagesPerFile: FREE_MAX_PAGES_PER_FILE,
    hasSupport: false,
    maxApiKeys: 2,
    apiAccess: true,
    authenticatedRequestsPerMinute: 60,
    apiRequestsPerMinute: 30,
  },
  pro: {
    monthlyConversions: null,
    operationsPerDay: null,
    monthlyWebCredits: 2_000,
    monthlyAiCredits: 200,
    storageBytes: 10 * GIB,
    maxFileSizeBytes: PRO_MAX_FILE_SIZE_BYTES,
    maxFilesPerOperation: null,
    maxPagesPerFile: null,
    hasSupport: true,
    maxApiKeys: 20,
    apiAccess: true,
    authenticatedRequestsPerMinute: 120,
    apiRequestsPerMinute: 60,
  },
};

export const PLAN_IDS = ["free", "pro"] as const;

export const WEB_PLAN_MONTHLY_PRICE_USD = {
  free: 0,
  pro: 0,
} as const;

export const API_PACK_YEARLY_DISCOUNT_PERCENT = 20;

export const API_PACK_MONTHLY_PRICE_USD = {
  starter: 9,
  growth: 29,
  scale: 99,
} as const;

export function apiPackYearlyPriceUsd(monthlyPriceUsd: number): number {
  return Math.round(
    (monthlyPriceUsd * 12 * (100 - API_PACK_YEARLY_DISCOUNT_PERCENT)) / 100,
  );
}

export type CatalogOfferPrice = {
  monthlyUsd: number;
  yearlyUsd: number | null;
};

export type BillingCatalogPrices = {
  pro: CatalogOfferPrice;
  starter: CatalogOfferPrice;
  growth: CatalogOfferPrice;
  scale: CatalogOfferPrice;
};

export function fallbackCatalogPrices(): BillingCatalogPrices {
  return {
    pro: {
      monthlyUsd: WEB_PLAN_MONTHLY_PRICE_USD.pro,
      yearlyUsd: null,
    },
    starter: {
      monthlyUsd: API_PACK_MONTHLY_PRICE_USD.starter,
      yearlyUsd: apiPackYearlyPriceUsd(API_PACK_MONTHLY_PRICE_USD.starter),
    },
    growth: {
      monthlyUsd: API_PACK_MONTHLY_PRICE_USD.growth,
      yearlyUsd: apiPackYearlyPriceUsd(API_PACK_MONTHLY_PRICE_USD.growth),
    },
    scale: {
      monthlyUsd: API_PACK_MONTHLY_PRICE_USD.scale,
      yearlyUsd: apiPackYearlyPriceUsd(API_PACK_MONTHLY_PRICE_USD.scale),
    },
  };
}

export function formatUsdAmount(usd: number): string {
  const cents = Math.round(usd * 100);

  if (cents % 100 === 0) {
    return `$${String(cents / 100)}`;
  }

  return `$${(cents / 100).toFixed(2)}`;
}

export const WEB_TIER_IDS = ["anonymous", "free", "pro"] as const;

export type WebTierId = (typeof WEB_TIER_IDS)[number];

export const ANONYMOUS_WEB_LIMITS = {
  maxFileSizeBytes: DEFAULT_PLAN_LIMITS.free.maxFileSizeBytes,
  maxFilesPerOperation: DEFAULT_PLAN_LIMITS.free.maxFilesPerOperation,
  maxPagesPerFile: DEFAULT_PLAN_LIMITS.free.maxPagesPerFile,
  retentionHours: FILE_RETENTION_HOURS,
  operationsPerDay: DEFAULT_PLAN_LIMITS.free.operationsPerDay,
  monthlyWebCredits: 0,
  monthlyAiCredits: 0,
} as const;

export const DEFAULT_API_CREDIT_PACKS = {
  starter: 2_000,
  growth: 10_000,
  scale: 100_000,
} as const;

export const INCLUDED_API_CREDITS_PER_MONTH = 100;

export function includedApiCreditBalance(input: {
  apiCreditsGranted: number;
  apiCreditsUsed: number;
  adjustmentTotal?: number;
}): {
  apiCreditsGranted: number;
  apiCreditsUsed: number;
  apiCreditsRemaining: number;
} {
  const included = INCLUDED_API_CREDITS_PER_MONTH;
  const extra = Math.max(0, input.adjustmentTotal ?? 0);
  const granted = included + extra;
  const used = Math.min(input.apiCreditsUsed, granted);

  return {
    apiCreditsGranted: granted,
    apiCreditsUsed: used,
    apiCreditsRemaining: Math.max(0, granted - input.apiCreditsUsed),
  };
}

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

export function resolveWebMaxFilesPerOperation(input: {
  isAuthenticated: boolean;
  toolMaxInputCount: number;
  planMaxFilesPerOperation?: number | null;
  combinesSourceFiles?: boolean;
  supportsBatch?: boolean;
}): number {
  if (input.combinesSourceFiles === true) {
    return input.toolMaxInputCount;
  }

  if (input.supportsBatch !== true) {
    return 1;
  }

  if (!input.isAuthenticated) {
    return ANONYMOUS_WEB_LIMITS.maxFilesPerOperation;
  }

  if (input.planMaxFilesPerOperation === null) {
    return PRO_MAX_FILES_PER_OPERATION;
  }

  return (
    input.planMaxFilesPerOperation ??
    DEFAULT_PLAN_LIMITS.free.maxFilesPerOperation
  );
}

export function resolveWebMaxPagesPerFile(input: {
  isAuthenticated: boolean;
  planMaxPagesPerFile?: number | null;
}): number | null {
  if (!input.isAuthenticated) {
    return ANONYMOUS_WEB_LIMITS.maxPagesPerFile;
  }

  if (input.planMaxPagesPerFile === undefined) {
    return DEFAULT_PLAN_LIMITS.free.maxPagesPerFile;
  }

  return input.planMaxPagesPerFile;
}
