import { MARKETING_PATHS } from "./marketing-paths";

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

export const MARKETING_FOOTER_LINK_IDS = [
  "tools",
  "pricing",
  "api",
  "signIn",
  "account",
] as const;

export type MarketingFooterLinkId = (typeof MARKETING_FOOTER_LINK_IDS)[number];

export type MarketingFooterLink = {
  id: MarketingFooterLinkId;
  href: string;
};

export function getMarketingFooterLinks(input: {
  accountHref: string;
  isAuthenticated: boolean;
}): readonly MarketingFooterLink[] {
  return [
    { id: "tools", href: MARKETING_PATHS.tools },
    { id: "pricing", href: MARKETING_PATHS.pricing },
    { id: "api", href: MARKETING_PATHS.developers },
    input.isAuthenticated
      ? { id: "account", href: input.accountHref }
      : { id: "signIn", href: input.accountHref },
  ];
}
