import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { MARKETING_PATHS } from "../lib/marketing-paths";
import type { PublicPlanPresentation } from "../lib/public-plans";
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
    <section className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("title")}
            </h2>
            <p className="mt-2 text-muted-foreground">{t("description")}</p>
          </div>
          <Link
            href={MARKETING_PATHS.pricing}
            className={buttonVariants({ variant: "outline" })}
          >
            {t("viewPage")}
          </Link>
        </div>
        <PricingCards
          plans={plans}
          startHref={startHref}
          proHref={proHref}
          premiumToolCount={premiumToolCount}
        />
        <p className="text-sm text-muted-foreground">{t("note")}</p>
      </div>
    </section>
  );
}
