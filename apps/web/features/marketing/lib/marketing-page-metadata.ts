import type { Metadata } from "next";
import { getPublicWebEnv } from "@/config/public-env";
import { openGraphLocale } from "@/features/public-tools/lib/public-tool-metadata";

export function buildMarketingPageMetadata(input: {
  title: string;
  description: string;
  path: string;
  locale: string;
}): Metadata {
  const url = `${getPublicWebEnv().appUrl}${input.path}`;

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      type: "website",
      locale: openGraphLocale(input.locale),
    },
    twitter: {
      card: "summary",
      title: input.title,
      description: input.description,
    },
  };
}
