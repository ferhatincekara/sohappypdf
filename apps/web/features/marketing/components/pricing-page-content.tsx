import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { MARKETING_PATHS } from "../lib/marketing-paths";
import type { PublicApiPackPresentation } from "../lib/public-api-packs";
import type {
  AnonymousPricingPresentation,
  PublicPlanPresentation,
} from "../lib/public-plans";
import { PricingCards } from "./pricing-cards";

export async function PricingPageContent({
  plans,
  apiPacks,
  anonymous,
  premiumToolCount,
  startHref,
  proHref,
  toolsHref,
}: {
  plans: readonly PublicPlanPresentation[];
  apiPacks: readonly PublicApiPackPresentation[];
  anonymous: AnonymousPricingPresentation;
  premiumToolCount: number;
  startHref: string;
  proHref: string;
  toolsHref: string;
}) {
  const t = await getTranslations("marketing.pricing");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("description")}</p>
      </div>

      <section aria-labelledby="pricing-web" className="flex flex-col gap-6">
        <div className="max-w-2xl">
          <h2 id="pricing-web" className="text-xl font-semibold tracking-tight">
            {t("web.title")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("web.description")}
          </p>
        </div>
        <PricingCards
          plans={plans}
          startHref={startHref}
          proHref={proHref}
          premiumToolCount={premiumToolCount}
        />
      </section>

      <section
        aria-labelledby="pricing-anonymous"
        className="rounded-lg border border-border bg-card p-6"
      >
        <h2
          id="pricing-anonymous"
          className="text-xl font-semibold tracking-tight"
        >
          {t("anonymous.name")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("anonymous.summary")}
        </p>
        <ul className="mt-4 flex flex-col gap-2 text-sm">
          <li>{t("limits.fileSize", { size: anonymous.maxFileSizeLabel })}</li>
          <li>
            {t("limits.filesPerOperation", {
              count: anonymous.maxFilesPerOperation,
            })}
          </li>
          <li>
            {t("limits.hourlyOperations", {
              count: anonymous.operationsPerHour,
            })}
          </li>
          <li>{t("limits.retention", { hours: anonymous.retentionHours })}</li>
          <li>{t("anonymous.noCredits")}</li>
        </ul>
        <Link
          href={toolsHref}
          className={buttonVariants({
            variant: "outline",
            className: "mt-6",
          })}
        >
          {t("anonymous.cta")}
        </Link>
      </section>

      <section aria-labelledby="pricing-api" className="flex flex-col gap-6">
        <div className="max-w-2xl">
          <h2 id="pricing-api" className="text-xl font-semibold tracking-tight">
            {t("api.title")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("api.description")}
          </p>
        </div>
        <ul className="grid gap-4 md:grid-cols-3">
          {apiPacks.map((pack) => (
            <li
              key={pack.id}
              className="flex flex-col rounded-lg border border-border bg-card p-6"
            >
              <h3 className="text-lg font-semibold">
                {t(`api.packs.${pack.id}.name`)}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(`api.packs.${pack.id}.summary`)}
              </p>
              <p className="mt-4 text-sm">
                {t("limits.apiCredits", { count: pack.monthlyApiCredits })}
              </p>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">{t("api.note")}</p>
        <Link
          href={MARKETING_PATHS.developers}
          className={buttonVariants({ variant: "outline", className: "w-fit" })}
        >
          {t("api.cta")}
        </Link>
      </section>

      <p className="text-sm text-muted-foreground">{t("note")}</p>
    </div>
  );
}
