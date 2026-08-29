import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { MarketingContainer } from "@/features/marketing/components/marketing-container";
import { MarketingPageHeader } from "@/features/marketing/components/marketing-page-header";
import { MarketingToolCard } from "@/features/marketing/components/marketing-tool-card";
import { getMarketingToolShortcuts } from "@/features/marketing/lib/marketing-tool-shortcuts";
import {
  type MarketingToolNavGroup,
  toolCategoryPath,
} from "@/features/marketing/lib/marketing-tools";
import { Link } from "@/lib/i18n/navigation";

export async function ToolDirectoryPageContent({
  groups,
}: {
  groups: readonly MarketingToolNavGroup[];
}) {
  const t = await getTranslations("marketing.toolsDirectory");
  const tNav = await getTranslations("marketing.nav");
  const tTools = await getTranslations("tools");
  const shortcuts = getMarketingToolShortcuts();

  return (
    <section className="pb-16 pt-8 md:pb-24 md:pt-12">
      <MarketingContainer>
        <MarketingPageHeader
          eyebrow={t("jump")}
          title={t("title")}
          description={t("description")}
        />

        <nav aria-label={t("jump")} className="mt-8 flex flex-wrap gap-2">
          {shortcuts.map((shortcut) => (
            <Button
              key={shortcut.id}
              variant="outline"
              size="sm"
              className="no-underline"
              nativeButton={false}
              render={<Link href={shortcut.href} />}
            >
              {tNav(`shortcuts.${shortcut.id}`)}
            </Button>
          ))}
        </nav>

        <div className="mt-12 flex flex-col gap-14">
          {groups.map((group) => (
            <section
              key={group.category}
              id={group.category}
              aria-labelledby={`tools-${group.category}`}
              className="scroll-mt-28"
            >
              <div className="mb-6">
                <h2
                  id={`tools-${group.category}`}
                  className="text-xl font-bold tracking-tight"
                >
                  <Link
                    href={toolCategoryPath(group.category)}
                    className="hover:opacity-70"
                  >
                    {tNav(`categories.${group.category}`)}
                  </Link>
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(`categories.${group.category}`)}
                </p>
              </div>
              <ul className="grid auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-6">
                {group.tools.map((tool) => (
                  <MarketingToolCard
                    key={tool.id}
                    tool={tool}
                    name={tTools(`${tool.id}.name`)}
                    description={tTools(`${tool.id}.description`)}
                    soonLabel={t("comingSoon")}
                    proLabel={t("pro")}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </MarketingContainer>
    </section>
  );
}
