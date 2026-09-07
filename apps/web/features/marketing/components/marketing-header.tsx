import { getTranslations } from "next-intl/server";
import type { AppShellUser } from "@/features/app-shell";
import { getWebToolBilling } from "@/features/billing/lib/get-web-billing-status";
import { MarketingHeaderBar } from "@/features/marketing/components/marketing-header-bar";
import { resolveMarketingCtas } from "@/features/marketing/lib/marketing-cta";
import { getMegaMenuSections } from "@/features/marketing/lib/mega-menu-sections";

export async function MarketingHeader({ user }: { user: AppShellUser | null }) {
  const t = await getTranslations("marketing.nav");
  const isAuthenticated = user !== null;
  const { navStartHref, signInHref } = resolveMarketingCtas(isAuthenticated);
  const startLabel = t("getStarted");
  const billing = isAuthenticated ? await getWebToolBilling() : null;
  const sections = getMegaMenuSections();

  return (
    <MarketingHeaderBar
      user={user}
      startHref={navStartHref}
      signInHref={signInHref}
      startLabel={startLabel}
      signInLabel={t("signIn")}
      sections={sections}
      showPremiumBadges={billing?.plan !== "pro"}
    />
  );
}
