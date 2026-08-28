"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function ToolFileUploadProgress({
  percent,
  label,
  determinate = true,
}: {
  percent: number;
  label: string;
  determinate?: boolean;
}) {
  const t = useTranslations("files.upload");
  const clamped = Math.min(100, Math.max(0, Math.round(percent)));
  const percentLabel = t("percent", { value: clamped });

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums">{percentLabel}</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={determinate ? clamped : undefined}
        aria-valuetext={percentLabel}
        className="h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn(
            "h-full bg-foreground",
            determinate
              ? "motion-safe:transition-[width] motion-safe:duration-150"
              : "w-1/3 animate-pulse",
          )}
          style={determinate ? { width: `${clamped}%` } : undefined}
        />
      </div>
    </div>
  );
}
