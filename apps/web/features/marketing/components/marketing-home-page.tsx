import { getTranslations } from "next-intl/server";
import { resolveMarketingCtas } from "../lib/marketing-cta";
import { countPremiumCatalogTools, getPublicPlans } from "../lib/public-plans";
import { DeveloperSection } from "./developer-section";
import { FeaturesSection } from "./features-section";
import { Hero } from "./hero";
import { HowItWorks } from "./how-it-works";
import { PricingSection } from "./pricing-section";
import { ProductDemoSection } from "./product-demo-section";
import { ProductJsonLd } from "./product-json-ld";
import { SecuritySection } from "./security-section";

export async function MarketingHomePage({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const t = await getTranslations("marketing");
  const { startHref, proHref } = resolveMarketingCtas(isAuthenticated);
  const plans = getPublicPlans();
  const premiumToolCount = countPremiumCatalogTools();

  return (
    <>
      <ProductJsonLd
        name={t("nav.brand")}
        description={t("metadata.homeDescription")}
        freePlanName={t("pricing.free.name")}
      />
      <Hero startHref={startHref} />
      <ProductDemoSection />
      <FeaturesSection />
      <HowItWorks />
      <DeveloperSection />
      <SecuritySection />
      <PricingSection
        plans={plans}
        startHref={startHref}
        proHref={proHref}
        premiumToolCount={premiumToolCount}
      />
    </>
  );
}
