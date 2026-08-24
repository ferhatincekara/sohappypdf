import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import type { PublicPlanPresentation } from "../lib/public-plans";

export async function PricingCards({
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
    <ul className="grid gap-4 md:grid-cols-2">
      {plans.map((plan) => {
        const isPro = plan.id === "pro";
        const href = isPro ? proHref : startHref;

        return (
          <li
            key={plan.id}
            className={cn(
              "flex flex-col rounded-lg border border-border bg-card p-6",
              isPro && "border-foreground",
            )}
          >
            <p className="text-sm font-medium text-muted-foreground">
              {isPro ? t("pro.badge") : t("free.badge")}
            </p>
            <h3 className="mt-2 text-2xl font-semibold">
              {t(`${plan.id}.name`)}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t(`${plan.id}.summary`)}
            </p>
            <ul className="mt-6 flex flex-col gap-2 text-sm">
              <li>
                {t("limits.webCredits", { count: plan.monthlyWebCredits })}
              </li>
              <li>
                {t("limits.conversions", { count: plan.monthlyConversions })}
              </li>
              <li>{t("limits.storage", { size: plan.storageLabel })}</li>
              <li>{t("limits.fileSize", { size: plan.maxFileSizeLabel })}</li>
              <li>{t("limits.apiKeys", { count: plan.maxApiKeys })}</li>
              <li>
                {t("limits.apiRate", { count: plan.apiRequestsPerMinute })}
              </li>
              {plan.apiAccess ? <li>{t("limits.apiAccess")}</li> : null}
            </ul>
            <Link
              href={href}
              className={buttonVariants({
                variant: isPro ? "default" : "outline",
                className: "mt-8 w-full",
              })}
            >
              {t(`${plan.id}.cta`)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
