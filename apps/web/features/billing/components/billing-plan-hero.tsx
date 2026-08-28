"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const billingHeroClassName =
  "rounded-7 bg-muted p-8 shadow-none md:p-10";

export const billingSectionClassName =
  "rounded-7 bg-muted p-6 shadow-none md:p-7";

export const billingTileClassName = "rounded-md bg-white";

export function BillingPlanHero({
  title,
  value,
  unit,
  secondary,
  description,
  paid,
  actions,
}: {
  title: string;
  value?: string;
  unit?: string;
  secondary?: string;
  description?: string;
  paid: boolean;
  actions?: ReactNode;
}) {
  const muted = paid ? "text-white/70" : "text-muted-foreground";

  return (
    <section
      className={cn(
        billingHeroClassName,
        paid ? "bg-foreground text-background" : null,
      )}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
            {title}
          </h2>
          {value === undefined ? null : (
            <p className="mt-6 flex items-end gap-1">
              <span className="text-5xl font-extrabold tracking-tight">
                {value}
              </span>
              {unit === undefined ? null : (
                <span className={cn("mb-1 text-sm font-medium", muted)}>
                  {unit}
                </span>
              )}
            </p>
          )}
          {secondary === undefined ? null : (
            <p className={cn("mt-1 text-sm tabular-nums", muted)}>
              {secondary}
            </p>
          )}
          {description === undefined ? null : (
            <p className={cn("mt-3 max-w-md text-lg/7", muted)}>
              {description}
            </p>
          )}
        </div>
        {actions === undefined ? null : (
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            {actions}
          </div>
        )}
      </div>
    </section>
  );
}

export function BillingSectionCard({
  title,
  description,
  meta,
  actions,
  children,
}: {
  title: string;
  description?: string;
  meta?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className={billingSectionClassName}>
      <h2 className="text-lg font-extrabold tracking-tight">{title}</h2>
      {description === undefined ? null : (
        <p className="mt-1 max-w-xl text-lg/7 text-muted-foreground">
          {description}
        </p>
      )}
      <div className="mt-5">{children}</div>
      {meta === undefined ? null : (
        <p className="mt-3 text-xs text-muted-foreground">{meta}</p>
      )}
      {actions === undefined ? null : (
        <div className="mt-6 flex flex-wrap gap-3">{actions}</div>
      )}
    </Card>
  );
}

export const billingStatGridClassName = "grid gap-3 sm:grid-cols-2";
