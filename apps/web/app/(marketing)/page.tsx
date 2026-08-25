import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getWebSession } from "@/features/auth/session/get-web-session";
import { hasWebSession } from "@/features/auth/session/session-state";
import { MarketingHomePage } from "@/features/marketing/components/marketing-home-page";
import { buildMarketingPageMetadata } from "@/features/marketing/lib/marketing-page-metadata";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.metadata");
  const locale = await getLocale();

  return buildMarketingPageMetadata({
    title: t("homeTitle"),
    description: t("homeDescription"),
    path: MARKETING_PATHS.home,
    locale,
  });
}

export default async function HomeRoute() {
  const session = await getWebSession();

  return <MarketingHomePage isAuthenticated={hasWebSession(session)} />;
}
