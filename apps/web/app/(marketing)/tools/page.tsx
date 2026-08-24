import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ToolDirectoryPageContent } from "@/features/marketing/components/tool-directory-page-content";
import { getMarketingToolDirectoryGroups } from "@/features/marketing/lib/marketing-tools";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.metadata");

  return {
    title: t("toolsTitle"),
    description: t("toolsDescription"),
    openGraph: {
      title: t("toolsTitle"),
      description: t("toolsDescription"),
      type: "website",
    },
  };
}

export default async function ToolsDirectoryPage() {
  return (
    <ToolDirectoryPageContent groups={getMarketingToolDirectoryGroups()} />
  );
}
