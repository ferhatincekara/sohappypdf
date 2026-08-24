export const MARKETING_SECURITY_IDS = [
  "authentication",
  "privateFiles",
  "authorization",
  "signedAccess",
  "apiKeys",
] as const;

export type MarketingSecurityId = (typeof MARKETING_SECURITY_IDS)[number];
