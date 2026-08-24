import { getTranslations } from "next-intl/server";
import type { PublicPlanPresentation } from "../lib/public-plans";
import { PricingCards } from "./pricing-cards";

export async function PricingPageContent({
  plans,
  startHref,
  proHref,
}: {
  plans: readonly PublicPlanPresentation[];
  startHref: string;
  proHref: string;
}) {
  const t = await getTranslations("marketing.pricing");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("description")}</p>
      </div>
      <PricingCards plans={plans} startHref={startHref} proHref={proHref} />
      <p className="text-sm text-muted-foreground">{t("note")}</p>
    </div>
  );
}
