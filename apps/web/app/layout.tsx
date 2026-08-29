import type { Metadata, Viewport } from "next";
import { Onest } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import {
  getLocale,
  getMessages,
  getNow,
  getTranslations,
} from "next-intl/server";
import type { ReactNode } from "react";
import { AppProviders } from "@/components/providers/app-providers";
import { getPublicWebEnv } from "@/config/public-env";
import { openGraphLocale } from "@/features/public-tools/lib/public-tool-metadata";
import {
  OPENGRAPH_IMAGE_ALT,
  OPENGRAPH_IMAGE_PATH,
  SITE_NAME,
  THEME_COLOR_DARK,
  THEME_COLOR_LIGHT,
  TITLE_TEMPLATE,
} from "@/features/seo/lib/site-brand";
import "./globals.css";

const onest = Onest({
  subsets: ["latin", "latin-ext"],
  variable: "--font-onest",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLOR_LIGHT },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLOR_DARK },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  const locale = await getLocale();

  return {
    metadataBase: new URL(getPublicWebEnv().appUrl),
    applicationName: SITE_NAME,
    title: {
      default: t("title"),
      template: TITLE_TEMPLATE,
    },
    description: t("description"),
    openGraph: {
      siteName: SITE_NAME,
      type: "website",
      locale: openGraphLocale(locale),
      images: [
        {
          url: OPENGRAPH_IMAGE_PATH,
          alt: OPENGRAPH_IMAGE_ALT,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: [OPENGRAPH_IMAGE_PATH],
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  const now = await getNow();

  return (
    <html lang={locale} className={onest.variable}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages} now={now}>
          <AppProviders>{children}</AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
