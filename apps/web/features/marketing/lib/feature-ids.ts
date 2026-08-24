export const MARKETING_FEATURE_IDS = [
  "conversion",
  "workflow",
  "history",
  "api",
  "keys",
  "limits",
  "security",
  "cloud",
] as const;

export type MarketingFeatureId = (typeof MARKETING_FEATURE_IDS)[number];
