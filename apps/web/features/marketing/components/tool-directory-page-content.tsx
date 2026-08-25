import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { getMarketingToolShortcuts } from "../lib/marketing-tool-shortcuts";
import {
  type MarketingToolNavGroup,
  toolCategoryPath,
} from "../lib/marketing-tools";

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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:py-16">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-muted-foreground text-pretty">
          {t("description")}
        </p>
      </header>

      <nav aria-label={t("jump")} className="flex flex-wrap gap-2">
        {shortcuts.map((shortcut) => (
          <Link
            key={shortcut.id}
            href={shortcut.href}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "no-underline",
            )}
          >
            {tNav(`shortcuts.${shortcut.id}`)}
          </Link>
        ))}
      </nav>

      <div className="flex flex-col gap-12">
        {groups.map((group) => (
          <section
            key={group.category}
            id={group.category}
            aria-labelledby={`tools-${group.category}`}
            className="flex scroll-mt-28 flex-col gap-4"
          >
            <div>
              <h2
                id={`tools-${group.category}`}
                className="text-xl font-semibold tracking-tight"
              >
                <Link
                  href={toolCategoryPath(group.category)}
                  className="hover:underline"
                >
                  {tNav(`categories.${group.category}`)}
                </Link>
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(`categories.${group.category}`)}
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.tools.map((tool) => {
                const isAvailable = tool.availability !== "planned";

                return (
                  <li key={tool.id}>
                    {isAvailable ? (
                      <Link
                        href={tool.href}
                        className="flex h-full flex-col rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                      >
                        <p className="text-sm font-medium text-foreground">
                          {tTools(`${tool.id}.name`)}
                        </p>
                        <p className="mt-2 flex-1 text-sm text-muted-foreground">
                          {tTools(`${tool.id}.description`)}
                        </p>
                        <span
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "mt-4 w-fit",
                          )}
                        >
                          {t("openTool")}
                        </span>
                      </Link>
                    ) : (
                      <div className="flex h-full flex-col rounded-lg border border-dashed border-border bg-card/60 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {tTools(`${tool.id}.name`)}
                          </p>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {t("comingSoon")}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {tTools(`${tool.id}.description`)}
                        </p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
