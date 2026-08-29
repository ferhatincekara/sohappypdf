import { getTranslations } from "next-intl/server";
import { MarketingContainer } from "@/features/marketing/components/marketing-container";
import { MarketingPageHeader } from "@/features/marketing/components/marketing-page-header";
import { MarketingToolCard } from "@/features/marketing/components/marketing-tool-card";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";
import type { MarketingToolNavGroup } from "@/features/marketing/lib/marketing-tools";
import { Link } from "@/lib/i18n/navigation";

export async function ToolCategoryPageContent({
  group,
}: {
  group: MarketingToolNavGroup;
}) {
  const t = await getTranslations("marketing.toolsDirectory");
  const tNav = await getTranslations("marketing.nav");
  const tTools = await getTranslations("tools");

  return (
    <section className="pb-16 pt-8 md:pb-24 md:pt-12">
      <MarketingContainer>
        <MarketingPageHeader
          eyebrow={
            <Link href={MARKETING_PATHS.tools} className="hover:opacity-70">
              {t("title")}
            </Link>
          }
          title={tNav(`categories.${group.category}`)}
          description={t(`categories.${group.category}`)}
        />
        <ul className="mt-12 grid auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
          {group.tools.map((tool) => (
            <MarketingToolCard
              key={tool.id}
              tool={tool}
              name={tTools(`${tool.id}.name`)}
              description={tTools(`${tool.id}.description`)}
              soonLabel={t("comingSoon")}
              proLabel={t("pro")}
              titleAs="h2"
            />
          ))}
        </ul>
      </MarketingContainer>
    </section>
  );
}
