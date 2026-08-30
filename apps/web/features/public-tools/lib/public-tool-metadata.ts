import type { Metadata } from "next";
import {
  brandedTitle,
  OPENGRAPH_IMAGE_ALT,
  OPENGRAPH_IMAGE_PATH,
  SITE_NAME,
} from "@/features/seo/lib/site-brand";
import { toOpenGraphLocale } from "@/lib/i18n/routing";

export type PublicToolMetadataInput = {
  name: string;
  metaTitle?: string;
  description: string;
  path: `/${string}`;
  appUrl: string;
  locale: string;
};

export function publicToolCanonicalUrl(input: {
  appUrl: string;
  path: `/${string}`;
}): string {
  return `${input.appUrl.replace(/\/$/, "")}${input.path}`;
}

export function openGraphLocale(locale: string): string {
  return toOpenGraphLocale(locale);
}

export function buildPublicToolMetadata(
  input: PublicToolMetadataInput,
): Metadata {
  const url = publicToolCanonicalUrl(input);
  const title = input.metaTitle ?? input.name;
  const socialTitle = brandedTitle(title);

  return {
    title,
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
