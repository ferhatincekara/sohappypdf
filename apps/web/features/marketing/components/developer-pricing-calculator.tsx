"use client";

import { formatUsdAmount } from "@sohappypdf/billing/plans";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { PillTabs } from "@/components/ui/pill-tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type DeveloperCalculatorTool,
  snapCreditIndex,
  tasksForCredits,
} from "@/features/marketing/lib/developer-calculator";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";
import type { PublicApiPackPresentation } from "@/features/marketing/lib/public-api-packs";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

type BillingCycle = "monthly" | "yearly";

function formatCredits(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function DeveloperPricingCalculator({
  packs,
  tools,
  checkoutHref,
  locale,
}: {
  packs: readonly PublicApiPackPresentation[];
  tools: readonly DeveloperCalculatorTool[];
  checkoutHref: string;
  locale: string;
}) {
  const t = useTranslations("marketing.pricing.developer");
  const tPricing = useTranslations("marketing.pricing");
  const tPacks = useTranslations("marketing.pricing.api.packs");
  const tTools = useTranslations("tools");
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [packIndex, setPackIndex] = useState(0);
  const defaultToolId = tools[0]?.id ?? "merge-pdf";
  const [toolId, setToolId] = useState(defaultToolId);

  const selectedPack = packs[snapCreditIndex(packIndex, packs.length)];
  const selectedTool =
    tools.find((tool) => tool.id === toolId) ?? tools[0] ?? null;
  const credits = selectedPack?.monthlyApiCredits ?? 0;
  const taskCount =
    selectedTool === null
      ? 0
      : tasksForCredits(credits, selectedTool.apiCreditCost);
  const fillPercent =
    packs.length <= 1 ? 100 : (packIndex / (packs.length - 1)) * 100;
  const priceUsd =
    selectedPack === undefined
      ? 0
      : cycle === "yearly"
        ? selectedPack.yearlyPriceUsd
        : selectedPack.monthlyPriceUsd;

  const selectItems = useMemo(
    () =>
      tools.map((tool) => ({
        value: tool.id,
        label: tTools(`${tool.id}.name`),
      })),
    [tTools, tools],
  );

  if (packs.length === 0 || selectedPack === undefined) {
    return null;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold tracking-tight">{t("cycleTitle")}</h3>
        <PillTabs
          layoutId="pricing-cycle"
          value={cycle}
          onValueChange={(id) => {
            setCycle(id as BillingCycle);
          }}
          items={[
            { id: "monthly", label: t("monthly") },
            {
              id: "yearly",
              label: (
                <>
                  {t("yearly")}
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-foreground">
                    {t("yearlyDiscount")}
                  </span>
                </>
              ),
            },
          ]}
        />
        <p className="text-sm text-muted-foreground">
          {t(`cycleNote.${cycle}`)}
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <h3 className="text-sm font-bold tracking-tight">
          {t("creditsTitle")}
        </h3>
        <div className="flex flex-col gap-3">
          <div className="relative px-3">
            <div className="relative h-10 rounded-full">
              <div className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 rounded-full bg-muted" />
              <div
                className="absolute top-1/2 left-0 h-3 -translate-y-1/2 rounded-full bg-foreground"
                style={{ width: `${fillPercent}%` }}
              />
              {packs.map((pack, index) => {
                const left =
                  packs.length <= 1 ? 0 : (index / (packs.length - 1)) * 100;

                return (
                  <span
                    key={pack.id}
                    className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground"
                    style={{ left: `${left}%` }}
                  />
                );
              })}
              <span
                className="pointer-events-none absolute top-1/2 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground ring-4 ring-background"
                style={{ left: `${fillPercent}%` }}
              />
              <input
                type="range"
                min={0}
                max={packs.length - 1}
                step={1}
                value={packIndex}
                aria-label={t("creditsTitle")}
                aria-valuetext={`${tPacks(`${selectedPack.id}.name`)} · ${formatCredits(credits, locale)} · ${formatUsdAmount(priceUsd)}`}
                className="absolute inset-0 w-full cursor-pointer opacity-0 outline-none"
                onChange={(event) => {
                  setPackIndex(Number(event.target.value));
                }}
              />
            </div>
          </div>
          <div className="flex items-start justify-between px-3">
            {packs.map((pack, index) => (
              <button
                key={pack.id}
                type="button"
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  packIndex === index
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
                onClick={() => {
                  setPackIndex(index);
                }}
              >
                {formatCredits(pack.monthlyApiCredits, locale)}
              </button>
            ))}
          </div>
        </div>
        <p className="flex items-end gap-1">
          <span className="text-5xl font-extrabold tracking-tight">
            {formatUsdAmount(priceUsd)}
          </span>
          <span className="mb-1 text-sm text-muted-foreground">
            {cycle === "yearly"
              ? tPricing("intervalYear")
              : tPricing("interval")}
          </span>
        </p>
        <p className="w-fit rounded-full bg-foreground px-3 py-1 text-sm font-semibold text-background">
          {tPacks(`${selectedPack.id}.name`)} · {formatCredits(credits, locale)}
        </p>
        <p className="text-sm text-muted-foreground">
          {t.rich("needMore", {
            contact: (chunks) => (
              <Link
                href={MARKETING_PATHS.contact}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-bold tracking-tight">
          {t("calculatorTitle")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t.rich("calculatorDescription", {
            credits: () => (
              <strong className="text-foreground">
                {formatCredits(credits, locale)}
              </strong>
            ),
          })}
        </p>
        {selectedTool === null ? null : (
          <Select
            value={toolId}
            items={selectItems}
            onValueChange={(value) => {
              if (value !== null) {
                setToolId(value);
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tools.map((tool) => (
                <SelectItem key={tool.id} value={tool.id}>
                  {tTools(`${tool.id}.name`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <p className="text-sm">
          {t.rich("calculatorResult", {
            count: () => <strong>{formatCredits(taskCount, locale)}</strong>,
            tool: () => (
              <strong>
                {selectedTool === null ? "" : tTools(`${selectedTool.id}.name`)}
              </strong>
            ),
          })}
        </p>
        <Button
          className="mt-1 w-fit"
          nativeButton={false}
          render={<Link href={checkoutHref} />}
        >
          {t("cta")}
        </Button>
      </div>
    </div>
  );
}
