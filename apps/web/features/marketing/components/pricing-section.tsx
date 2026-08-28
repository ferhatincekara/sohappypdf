import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { MARKETING_PATHS } from "../lib/marketing-paths";
import type { PublicPlanPresentation } from "../lib/public-plans";
import { MarketingContainer } from "./marketing-container";
import { PricingCards } from "./pricing-cards";

export async function PricingSection({
  plans,
  startHref,
  proHref,
  premiumToolCount,
}: {
  plans: readonly PublicPlanPresentation[];
  startHref: string;
  proHref: string;
  premiumToolCount: number;
}) {
  const t = await getTranslations("marketing.pricing");

  return (
    <section className="py-16 md:py-24">
      <MarketingContainer className="flex flex-col gap-10">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-[52px] md:leading-tight">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg/7 text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <PricingCards
          plans={plans}
          startHref={startHref}
          proHref={proHref}
          premiumToolCount={premiumToolCount}
        />
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">{t("note")}</p>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={MARKETING_PATHS.pricing} />}
          >
            {t("viewPage")}
          </Button>
        </div>
      </MarketingContainer>
    </section>
  );
}
