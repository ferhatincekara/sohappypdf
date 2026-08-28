export const MARKETING_SOCIAL_LINK_IDS = [
  "instagram",
  "x",
  "linkedin",
] as const;

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
  {
    id: "x",
    href: "https://x.com/sohappypdf",
  },
  {
    id: "linkedin",
    href: "https://www.linkedin.com/company/sohappypdf",
  },
];
