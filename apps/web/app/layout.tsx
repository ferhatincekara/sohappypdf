import type { Metadata } from "next";
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
import "./globals.css";

const onest = Onest({
  subsets: ["latin", "latin-ext"],
  variable: "--font-onest",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");

  return {
    metadataBase: new URL(getPublicWebEnv().appUrl),
    title: t("title"),
    description: t("description"),
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
