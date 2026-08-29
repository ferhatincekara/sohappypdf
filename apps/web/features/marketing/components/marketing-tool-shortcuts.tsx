import { getTranslations } from "next-intl/server";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";
import { getMarketingToolShortcuts } from "@/features/marketing/lib/marketing-tool-shortcuts";
import { Link } from "@/lib/i18n/navigation";

export async function MarketingToolShortcuts() {
  const t = await getTranslations("marketing.nav");
  const shortcuts = getMarketingToolShortcuts();

  return (
    <nav
      aria-label={t("shortcuts.label")}
      className="border-b border-border bg-background"
    >
      <div className="mx-auto flex w-full max-w-6xl items-center gap-1 overflow-x-auto px-4 py-2 md:flex-wrap">
        {shortcuts.map((shortcut) => (
          <Link
            key={shortcut.id}
            href={shortcut.href}
            className="shrink-0 rounded-md px-2.5 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground outline-none"
          >
            {t(`shortcuts.${shortcut.id}`)}
          </Link>
        ))}
        <Link
          href={MARKETING_PATHS.tools}
          className="shrink-0 rounded-md px-2.5 py-1 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 outline-none"
        >
          {t("allTools")}
        </Link>
      </div>
    </nav>
  );
}
