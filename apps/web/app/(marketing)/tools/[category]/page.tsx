import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ToolCategoryPageContent } from "@/features/marketing/components/tool-category-page-content";
import { buildMarketingPageMetadata } from "@/features/marketing/lib/marketing-page-metadata";
import {
  findToolCategoryBySlug,
  getMarketingToolDirectoryGroups,
  MARKETING_TOOL_CATEGORY_ORDER,
  MARKETING_TOOL_CATEGORY_SLUGS,
  toolCategoryPath,
} from "@/features/marketing/lib/marketing-tools";

export function generateStaticParams() {
  return MARKETING_TOOL_CATEGORY_ORDER.map((category) => ({
    category: MARKETING_TOOL_CATEGORY_SLUGS[category],
  }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = findToolCategoryBySlug(slug);

  if (category === undefined) {
    return {};
  }

  const tMeta = await getTranslations("marketing.metadata");
  const tDirectory = await getTranslations("marketing.toolsDirectory");
  const locale = await getLocale();

  return buildMarketingPageMetadata({
    title: tMeta(`categoryTitles.${category}`),
    description: tDirectory(`categories.${category}`),
    path: toolCategoryPath(category),
    locale,
  });
}

export default async function ToolCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = findToolCategoryBySlug(slug);
  const group = getMarketingToolDirectoryGroups().find(
    (item) => item.category === category,
  );

  if (category === undefined || group === undefined) {
    notFound();
  }

  return <ToolCategoryPageContent group={group} />;
}
