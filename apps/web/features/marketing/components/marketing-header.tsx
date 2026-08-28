import { getTranslations } from "next-intl/server";
import type { AppShellUser } from "@/features/app-shell";
import { resolveMarketingCtas } from "../lib/marketing-cta";
import { getMarketingToolDirectoryGroups } from "../lib/marketing-tools";
import { MarketingHeaderBar } from "./marketing-header-bar";

export async function MarketingHeader({ user }: { user: AppShellUser | null }) {
  const t = await getTranslations("marketing.nav");
  const isAuthenticated = user !== null;
  const { startHref, signInHref } = resolveMarketingCtas(isAuthenticated);
  const startLabel = t("getStarted");
  const toolGroups = getMarketingToolDirectoryGroups();

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
