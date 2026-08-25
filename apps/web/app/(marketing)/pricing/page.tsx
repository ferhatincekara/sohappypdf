import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getWebSession } from "@/features/auth/session/get-web-session";
import { hasWebSession } from "@/features/auth/session/session-state";
import { PricingPageContent } from "@/features/marketing/components/pricing-page-content";
import { resolveMarketingCtas } from "@/features/marketing/lib/marketing-cta";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";
import { getPublicApiPacks } from "@/features/marketing/lib/public-api-packs";
import {
  countPremiumCatalogTools,
  getAnonymousPricingPresentation,
  getPublicPlans,
} from "@/features/marketing/lib/public-plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.metadata");

  return {
    title: t("pricingTitle"),
    description: t("pricingDescription"),
    openGraph: {
      title: t("pricingTitle"),
      description: t("pricingDescription"),
      type: "website",
    },
  };
}

export default async function PricingRoute() {
  const session = await getWebSession();
  const isAuthenticated = hasWebSession(session);
  const { startHref, proHref } = resolveMarketingCtas(isAuthenticated);

  return (
    <PricingPageContent
      plans={getPublicPlans()}
      apiPacks={getPublicApiPacks()}
      anonymous={getAnonymousPricingPresentation()}
      premiumToolCount={countPremiumCatalogTools()}
      startHref={startHref}
      proHref={proHref}
      toolsHref={MARKETING_PATHS.tools}
    />
  );
}
