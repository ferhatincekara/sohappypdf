export const LEGAL_PAGE_IDS = [
  "security",
  "privacy",
  "terms",
  "cookies",
] as const;

export type LegalPageId = (typeof LEGAL_PAGE_IDS)[number];

export const LEGAL_PATHS = {
  security: "/security",
  privacy: "/privacy",
  terms: "/terms",
  cookies: "/cookies",
} as const satisfies Record<LegalPageId, `/${LegalPageId}`>;

export const LEGAL_UPDATED_AT = "2026-08-28";

export const LEGAL_PAGE_SECTIONS = {
  security: ["honest", "files", "accounts", "api", "report"],
  privacy: [
    "overview",
    "files",
    "accounts",
    "payments",
    "cookies",
    "retention",
    "processors",
    "contact",
  ],
  terms: [
    "service",
    "accounts",
    "acceptableUse",
    "files",
    "billing",
    "api",
    "changes",
    "contact",
  ],
  cookies: ["overview", "language", "session", "payments", "control"],
} as const satisfies Record<LegalPageId, readonly string[]>;
