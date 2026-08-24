import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { resolveMarketingCtas } from "../lib/marketing-cta";
import { MARKETING_NAV_LINKS } from "../lib/marketing-nav";
import { MARKETING_PATHS } from "../lib/marketing-paths";
import { MarketingMobileNav } from "./marketing-mobile-nav";
import { MarketingToolShortcuts } from "./marketing-tool-shortcuts";

export async function MarketingHeader({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const t = await getTranslations("marketing.nav");
  const { startHref, signInHref } = resolveMarketingCtas(isAuthenticated);
  const startLabel = t("getStarted");
  const signInLabel = t("signIn");

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        {t("skip")}
      </a>
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href={MARKETING_PATHS.home}
          className="text-sm font-semibold tracking-tight"
        >
          {t("brand")}
        </Link>
        <nav
          aria-label={t("menu")}
          className="hidden items-center gap-1 md:flex"
        >
          <Link
            href={MARKETING_PATHS.tools}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            {t("tools")}
          </Link>
          {MARKETING_NAV_LINKS.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              {t(item.id)}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? null : (
            <Link
              href={signInHref}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              {signInLabel}
            </Link>
          )}
          <Link href={startHref} className={buttonVariants({ size: "sm" })}>
            {startLabel}
          </Link>
        </div>
        <MarketingMobileNav
          startHref={startHref}
          signInHref={signInHref}
          startLabel={startLabel}
          signInLabel={signInLabel}
          isAuthenticated={isAuthenticated}
        />
      </div>
      <MarketingToolShortcuts />
    </header>
  );
}
