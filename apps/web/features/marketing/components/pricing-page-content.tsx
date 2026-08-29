import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { DeveloperCreditsTable } from "@/features/marketing/components/developer-credits-table";
import { DeveloperPricingCalculator } from "@/features/marketing/components/developer-pricing-calculator";
import { MarketingContainer } from "@/features/marketing/components/marketing-container";
import { MarketingPageHeader } from "@/features/marketing/components/marketing-page-header";
import { PricingCards } from "@/features/marketing/components/pricing-cards";
import { listDeveloperCalculatorTools } from "@/features/marketing/lib/developer-calculator";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";
import type { PublicApiPackPresentation } from "@/features/marketing/lib/public-api-packs";
import type { PublicPlanPresentation } from "@/features/marketing/lib/public-plans";
import { Link } from "@/lib/i18n/navigation";

export async function PricingPageContent({
  plans,
  apiPacks,
  startHref,
  proHref,
  apiHref,
}: {
  plans: readonly PublicPlanPresentation[];
  apiPacks: readonly PublicApiPackPresentation[];
  startHref: string;
  proHref: string;
  apiHref: string;
}) {
  const t = await getTranslations("marketing.pricing");
  const locale = await getLocale();
  const calculatorTools = listDeveloperCalculatorTools();

  return (
    <div className="pb-16 pt-8 md:pb-24 md:pt-12">
      <MarketingContainer className="flex flex-col gap-16 md:gap-20">
        <MarketingPageHeader
          title={t("title")}
          description={t("description")}
        />

        <section aria-labelledby="pricing-web" className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2
              id="pricing-web"
              className="text-xl font-bold tracking-tight md:text-2xl"
            >
              {t("web.title")}
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              {t("web.description")}
            </p>
          </div>
          <PricingCards plans={plans} startHref={startHref} proHref={proHref} />
        </section>

        <section
          aria-labelledby="pricing-api"
          className="flex flex-col gap-10 md:gap-12"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex max-w-2xl flex-col gap-2">
              <h2
                id="pricing-api"
                className="text-xl font-bold tracking-tight md:text-2xl"
              >
                {t("developer.title")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("developer.description")}
              </p>
            </div>
            <Button
              variant="outline"
              className="w-fit shrink-0"
              nativeButton={false}
              render={<Link href={MARKETING_PATHS.developers} />}
            >
              {t("developer.docsCta")}
            </Button>
          </div>
          <DeveloperPricingCalculator
            packs={apiPacks}
            tools={calculatorTools}
            checkoutHref={apiHref}
            locale={locale}
          />
          <DeveloperCreditsTable tools={calculatorTools} />
        </section>
      </MarketingContainer>
    </div>
  );
}
