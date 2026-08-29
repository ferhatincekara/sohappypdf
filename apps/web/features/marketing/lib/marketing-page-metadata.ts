import type { Metadata } from "next";
import { getPublicWebEnv } from "@/config/public-env";
import { openGraphLocale } from "@/features/public-tools/lib/public-tool-metadata";
import {
  brandedTitle,
  OPENGRAPH_IMAGE_ALT,
  OPENGRAPH_IMAGE_PATH,
  SITE_NAME,
} from "@/features/seo/lib/site-brand";

export function buildMarketingPageMetadata(input: {
  title: string;
  description: string;
  path: string;
  locale: string;
  absolute?: boolean;
}): Metadata {
  const url = `${getPublicWebEnv().appUrl}${input.path}`;
  const socialTitle = input.absolute ? input.title : brandedTitle(input.title);

  return {
    title: input.absolute ? { absolute: input.title } : input.title,
    description: input.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: socialTitle,
      description: input.description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: openGraphLocale(input.locale),
      images: [
        {
          url: OPENGRAPH_IMAGE_PATH,
          alt: OPENGRAPH_IMAGE_ALT,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: input.description,
      images: [OPENGRAPH_IMAGE_PATH],
    },
  };
}
