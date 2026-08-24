import { MARKETING_PATHS } from "./marketing-paths";

export const MARKETING_NAV_LINK_IDS = [
  "product",
  "pricing",
  "developers",
] as const;

export type MarketingNavLinkId = (typeof MARKETING_NAV_LINK_IDS)[number];

export type MarketingNavLink = {
  id: MarketingNavLinkId;
  href: string;
};

export const MARKETING_NAV_LINKS: readonly MarketingNavLink[] = [
  { id: "product", href: MARKETING_PATHS.product },
  { id: "pricing", href: MARKETING_PATHS.pricing },
  { id: "developers", href: MARKETING_PATHS.developers },
];

export const MARKETING_FOOTER_LINK_IDS = [
  "product",
  "pricing",
  "api",
  "signIn",
] as const;

export type MarketingFooterLinkId = (typeof MARKETING_FOOTER_LINK_IDS)[number];

export type MarketingFooterLink = {
  id: MarketingFooterLinkId;
  href: string;
};

export function getMarketingFooterLinks(
  signInHref: string,
): readonly MarketingFooterLink[] {
  return [
    { id: "product", href: MARKETING_PATHS.product },
    { id: "pricing", href: MARKETING_PATHS.pricing },
    { id: "api", href: MARKETING_PATHS.developers },
    { id: "signIn", href: signInHref },
  ];
}
