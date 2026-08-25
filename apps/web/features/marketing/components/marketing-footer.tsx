import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { resolveSignInHref } from "../lib/marketing-cta";
import { getMarketingFooterLinks } from "../lib/marketing-nav";
import { MARKETING_PATHS } from "../lib/marketing-paths";

export async function MarketingFooter({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const t = await getTranslations("marketing.footer");
  const links = getMarketingFooterLinks({
    accountHref: resolveSignInHref(isAuthenticated),
    isAuthenticated,
  });

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={MARKETING_PATHS.home}
          className="text-sm font-semibold tracking-tight"
        >
          {t("brand")}
        </Link>
        <nav aria-label={t("menu")}>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {links.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="underline-offset-4 hover:text-foreground hover:underline"
                >
                  {t(item.id)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
