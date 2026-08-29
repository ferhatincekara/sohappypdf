import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";

export const MARKETING_NAV_LINK_IDS = ["pricing", "developers"] as const;

export type MarketingNavLinkId = (typeof MARKETING_NAV_LINK_IDS)[number];

export type MarketingNavLink = {
  id: MarketingNavLinkId;
  href: string;
};

export const MARKETING_NAV_LINKS: readonly MarketingNavLink[] = [
  { id: "pricing", href: MARKETING_PATHS.pricing },
  { id: "developers", href: MARKETING_PATHS.developers },
];

export const STATUS_PAGE_RECOVERY_LINKS = [
  { id: "tools" as const, href: MARKETING_PATHS.tools },
  ...MARKETING_NAV_LINKS,
];

export const MARKETING_MOBILE_MENU_LINK_IDS = [
  "tools",
  "pricing",
  "developers",
  "about",
  "blog",
  "faq",
  "contact",
] as const;

export type MarketingMobileMenuLinkId =
  (typeof MARKETING_MOBILE_MENU_LINK_IDS)[number];

export type MarketingMobileMenuLink = {
  id: MarketingMobileMenuLinkId;
  href: string;
};

export const MARKETING_MOBILE_MENU_LINKS: readonly MarketingMobileMenuLink[] = [
  { id: "tools", href: MARKETING_PATHS.tools },
  { id: "pricing", href: MARKETING_PATHS.pricing },
  { id: "developers", href: MARKETING_PATHS.developers },
  { id: "about", href: MARKETING_PATHS.about },
  { id: "blog", href: MARKETING_PATHS.blog },
  { id: "faq", href: MARKETING_PATHS.faq },
  { id: "contact", href: MARKETING_PATHS.contact },
];

export const MARKETING_FOOTER_PRODUCT_LINKS = [
  { id: "tools" as const, href: MARKETING_PATHS.tools },
  { id: "pricing" as const, href: MARKETING_PATHS.pricing },
  { id: "api" as const, href: MARKETING_PATHS.developers },
];

export const MARKETING_FOOTER_COMPANY_LINKS = [
  { id: "about" as const, href: MARKETING_PATHS.about },
  { id: "blog" as const, href: MARKETING_PATHS.blog },
  { id: "faq" as const, href: MARKETING_PATHS.faq },
  { id: "contact" as const, href: MARKETING_PATHS.contact },
];

export const MARKETING_FOOTER_LEGAL_LINKS = [
  { id: "security" as const, href: MARKETING_PATHS.security },
  { id: "privacy" as const, href: MARKETING_PATHS.privacy },
  { id: "terms" as const, href: MARKETING_PATHS.terms },
  { id: "cookies" as const, href: MARKETING_PATHS.cookies },
];

export const MARKETING_FOOTER_TOOL_LINKS = [
  { href: "/merge-pdf", shortcutId: "merge" },
  { href: "/compress-pdf", shortcutId: "compress" },
  { href: "/pdf-to-word", shortcutId: "convert" },
  { href: "/protect-pdf", shortcutId: "protect" },
] as const;

export type MarketingFooterToolLink =
  (typeof MARKETING_FOOTER_TOOL_LINKS)[number];
