import { getTranslations } from "next-intl/server";
import { BrandLogo } from "@/components/brand-logo";
import { Link } from "@/lib/i18n/navigation";
import {
  MARKETING_FOOTER_COMPANY_LINKS,
  MARKETING_FOOTER_LEGAL_LINKS,
  MARKETING_FOOTER_PRODUCT_LINKS,
  MARKETING_FOOTER_TOOL_LINKS,
} from "../lib/marketing-nav";
import { MARKETING_PATHS } from "../lib/marketing-paths";
import { MARKETING_SOCIAL_LINKS } from "../lib/marketing-social";
import { LocaleSwitcher } from "./locale-switcher";
import { MarketingContainer } from "./marketing-container";
import { MarketingSocialLinks } from "./marketing-social-links";

export async function MarketingFooter() {
  const t = await getTranslations("marketing.footer");
  const tNav = await getTranslations("marketing.nav");

  return (
    <footer className="px-4 pb-6 pt-4 md:px-6 md:pt-8">
      <div className="rounded-10 bg-muted px-5 py-12 md:px-12 md:py-16">
        <MarketingContainer className="px-0">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_1.8fr]">
            <div>
              <Link href={MARKETING_PATHS.home} className="inline-flex">
                <BrandLogo title={t("brand")} />
              </Link>
              <p className="mt-5 max-w-sm text-base text-foreground">
                {t("blurb")}
              </p>
              <MarketingSocialLinks
                links={MARKETING_SOCIAL_LINKS}
                groupLabel={t("social")}
                labels={{
                  instagram: t("instagram"),
                  x: t("x"),
                  linkedin: t("linkedin"),
                }}
              />
            </div>

            <nav aria-label={t("menu")}>
              <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
                <div>
                  <p className="mb-4 text-sm font-bold">{t("product")}</p>
                  <ul className="space-y-2.5">
                    {MARKETING_FOOTER_PRODUCT_LINKS.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {t(item.id)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-4 text-sm font-bold">{tNav("tools")}</p>
                  <ul className="space-y-2.5">
                    {MARKETING_FOOTER_TOOL_LINKS.map((item) => (
                      <li key={item.shortcutId}>
                        <Link
                          href={item.href}
                          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {tNav(`shortcuts.${item.shortcutId}`)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-4 text-sm font-bold">{t("legal")}</p>
                  <ul className="space-y-2.5">
                    {MARKETING_FOOTER_LEGAL_LINKS.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {t(item.id)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-4 text-sm font-bold">{t("company")}</p>
                  <ul className="space-y-2.5">
                    {MARKETING_FOOTER_COMPANY_LINKS.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {t(item.id)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </nav>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-6 text-sm text-muted-foreground">
            <LocaleSwitcher size="sm" />
            <p>{t("copyright", { year: new Date().getFullYear() })}</p>
          </div>
        </MarketingContainer>
      </div>
    </footer>
  );
}
