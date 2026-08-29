import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getWebSession } from "@/features/auth/session/get-web-session";
import { hasWebSession } from "@/features/auth/session/session-state";
import { PricingPageContent } from "@/features/marketing/components/pricing-page-content";
import { loadPublicPricingCatalog } from "@/features/marketing/lib/load-public-pricing-catalog";
import { resolveMarketingCtas } from "@/features/marketing/lib/marketing-cta";
import { buildMarketingPageMetadata } from "@/features/marketing/lib/marketing-page-metadata";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";
import { getPublicApiPacks } from "@/features/marketing/lib/public-api-packs";
import { getPublicPlans } from "@/features/marketing/lib/public-plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.metadata");
  const locale = await getLocale();

  return buildMarketingPageMetadata({
    title: t("pricingTitle"),
    description: t("pricingDescription"),
    path: MARKETING_PATHS.pricing,
    locale,
  });
}

export default async function PricingRoute() {
  const session = await getWebSession();
  const isAuthenticated = hasWebSession(session);
  const { startHref, proHref, apiHref } = resolveMarketingCtas(isAuthenticated);
  const catalog = await loadPublicPricingCatalog();

  return (
    <PricingPageContent
      plans={getPublicPlans(catalog)}
      apiPacks={getPublicApiPacks(catalog)}
      startHref={startHref}
      proHref={proHref}
      apiHref={apiHref}
    />
  );
}
