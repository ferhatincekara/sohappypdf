"use client";

import { Button } from "@/components/ui/button";
import { billingTileClassName } from "@/features/billing/components/billing-plan-hero";
import { cn } from "@/lib/utils";

export function BillingOfferCard({
  title,
  subtitle,
  price,
  unit,
  actionLabel,
  isCurrent,
  isPending,
  cta,
  onClick,
}: {
  title: string;
  subtitle: string;
  price: string;
  unit: string;
  actionLabel: string;
  isCurrent: boolean;
  isPending: boolean;
  cta: "subscribe" | "switch" | "current";
  onClick: () => void;
}) {
  const muted = isCurrent ? "text-white/70" : "text-muted-foreground";

  return (
    <div
      className={cn(
        "flex h-full flex-col justify-between gap-8 rounded-3xl p-6 md:p-7",
        isCurrent ? "bg-foreground text-background" : billingTileClassName,
      )}
    >
      <div>
        <p className="text-xl font-extrabold tracking-tight">{title}</p>
        <p className={cn("mt-2 text-sm leading-relaxed", muted)}>{subtitle}</p>
        <p className="mt-8 flex items-end gap-1">
          <span className="text-4xl font-extrabold tracking-tight">
            {price}
          </span>
          <span className={cn("mb-1 text-sm font-medium", muted)}>{unit}</span>
        </p>
      </div>
      <Button
        type="button"
        className={cn("w-full", isCurrent && "disabled:opacity-100")}
        variant={
          isCurrent ? "white" : cta === "subscribe" ? "default" : "outline"
        }
        disabled={isPending || isCurrent}
        aria-busy={isPending && !isCurrent}
        onClick={onClick}
      >
        {actionLabel}
      </Button>
    </div>
  );
}
