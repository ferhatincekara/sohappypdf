import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AboutPageContent } from "@/features/marketing/components/about-page-content";
import { buildMarketingPageMetadata } from "@/features/marketing/lib/marketing-page-metadata";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.metadata");
  const locale = await getLocale();

  return buildMarketingPageMetadata({
    title: t("aboutTitle"),
    description: t("aboutDescription"),
    path: MARKETING_PATHS.about,
    locale,
  });
}

export default function AboutRoute() {
  return <AboutPageContent />;
}
