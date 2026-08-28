import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { DeveloperDocsPage } from "@/features/developer-docs";
import { buildMarketingPageMetadata } from "@/features/marketing/lib/marketing-page-metadata";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.metadata");
  const locale = await getLocale();

  return buildMarketingPageMetadata({
    title: t("developersTitle"),
    description: t("developersDescription"),
    path: MARKETING_PATHS.developers,
    locale,
  });
}

export default function DevelopersRoute() {
  return <DeveloperDocsPage />;
}
