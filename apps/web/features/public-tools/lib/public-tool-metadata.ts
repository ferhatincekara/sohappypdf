import type { Metadata } from "next";

export type PublicToolMetadataInput = {
  name: string;
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
  if (locale === "tr") {
    return "tr_TR";
  }

  return "en_US";
}

export function buildPublicToolMetadata(
  input: PublicToolMetadataInput,
): Metadata {
  const url = publicToolCanonicalUrl(input);
  const title = `${input.name} | SohappyPDF`;

  return {
    title,
    description: input.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description: input.description,
      url,
      type: "website",
      locale: openGraphLocale(input.locale),
    },
    twitter: {
      card: "summary",
      title,
      description: input.description,
    },
  };
}
