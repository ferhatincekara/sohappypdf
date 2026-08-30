export const MARKETING_SOCIAL_LINK_IDS = ["instagram"] as const;

export type MarketingSocialLinkId = (typeof MARKETING_SOCIAL_LINK_IDS)[number];

export type MarketingSocialLink = {
  id: MarketingSocialLinkId;
  href: string;
};

export const MARKETING_SOCIAL_LINKS: readonly MarketingSocialLink[] = [
  {
    id: "instagram",
    href: "https://www.instagram.com/sohappypdf",
  },
];
