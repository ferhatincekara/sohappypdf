import { formatUsdAmount } from "@repo/billing/plans";
import { CheckIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import type { PublicPlanPresentation } from "../lib/public-plans";

export async function PricingCards({
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
    <ul className="grid gap-5 md:grid-cols-2">
      {plans.map((plan) => {
        const isPro = plan.id === "pro";
        const href = isPro ? proHref : startHref;
        const items = isPro
          ? [
              t("limits.unlimitedOperations"),
              t("limits.fileSize", { size: plan.maxFileSizeLabel }),
              t("limits.multiFile"),
              t("limits.noPageCap"),
              t("limits.retention", { hours: 2 }),
              premiumToolCount > 0
                ? t("limits.premiumTools", { count: premiumToolCount })
                : t("limits.standardTools"),
              t("limits.supportIncluded"),
            ]
          : [
              t("limits.noAccountRequired"),
              t("limits.dailyOperations", {
                count: plan.operationsPerDay ?? 0,
              }),
              t("limits.fileSize", { size: plan.maxFileSizeLabel }),
              t("limits.filesPerOperation", {
                count: plan.maxFilesPerOperation ?? 1,
              }),
              t("limits.pagesPerFile", {
                count: plan.maxPagesPerFile ?? 0,
              }),
              t("limits.retention", { hours: 2 }),
              t("limits.noOcr"),
              t("limits.noSupport"),
            ];

        return (
          <li key={plan.id}>
            <Card
              className={cn(
                "h-full rounded-4xl border p-8 shadow-none md:p-10",
                isPro
                  ? "border-transparent bg-foreground text-background"
                  : "border-border bg-white",
              )}
            >
              <CardContent className="flex h-full flex-col p-0">
                <Badge variant={isPro ? "secondary" : "default"}>
                  {isPro ? t("pro.badge") : t("free.badge")}
                </Badge>
                <h3 className="mt-5 text-2xl font-bold">
                  {t(`${plan.id}.name`)}
                </h3>
                <p
                  className={cn(
                    "mt-2 text-sm",
                    isPro ? "text-white/70" : "text-muted-foreground",
                  )}
                >
                  {t(`${plan.id}.summary`)}
                </p>
                <p className="mt-6 flex items-end gap-1">
                  <span className="text-5xl font-extrabold">
                    {formatUsdAmount(plan.monthlyPriceUsd)}
                  </span>
                  <span
                    className={cn(
                      "mb-1 text-sm",
                      isPro ? "text-white/60" : "text-muted-foreground",
                    )}
                  >
                    {t("interval")}
                  </span>
                </p>
                <ul className="mt-8 flex flex-1 flex-col gap-3">
                  {items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <CheckIcon
                        className={cn(
                          "size-5 shrink-0",
                          isPro ? "text-secondary" : "text-foreground",
                        )}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={isPro ? "white" : "outline"}
                  className="mt-8 w-full"
                  nativeButton={false}
                  render={<Link href={href} />}
                >
                  {t(`${plan.id}.cta`)}
                </Button>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
