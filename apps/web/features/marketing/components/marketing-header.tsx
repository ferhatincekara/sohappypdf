import { getTranslations } from "next-intl/server";
import type { AppShellUser } from "@/features/app-shell";
import { MarketingHeaderBar } from "@/features/marketing/components/marketing-header-bar";
import { resolveMarketingCtas } from "@/features/marketing/lib/marketing-cta";
import { getMarketingToolMenuGroups } from "@/features/marketing/lib/marketing-tools";

export async function MarketingHeader({ user }: { user: AppShellUser | null }) {
  const t = await getTranslations("marketing.nav");
  const isAuthenticated = user !== null;
  const { startHref, signInHref } = resolveMarketingCtas(isAuthenticated);
  const startLabel = t("getStarted");
  const toolGroups = getMarketingToolMenuGroups();

  return (
    <MarketingHeaderBar
      user={user}
      startHref={startHref}
      signInHref={signInHref}
      startLabel={startLabel}
      signInLabel={t("signIn")}
      toolGroups={toolGroups}
    />
  );
}
