import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ToolDirectoryPageContent } from "@/features/marketing/components/tool-directory-page-content";
import { buildMarketingPageMetadata } from "@/features/marketing/lib/marketing-page-metadata";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";
import { getMarketingToolDirectoryGroups } from "@/features/marketing/lib/marketing-tools";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.metadata");
  const locale = await getLocale();

  return buildMarketingPageMetadata({
    title: t("toolsTitle"),
    description: t("toolsDescription"),
    path: MARKETING_PATHS.tools,
    locale,
  });
}

export default async function ToolsDirectoryPage() {
  return (
    <ToolDirectoryPageContent groups={getMarketingToolDirectoryGroups()} />
  );
}
