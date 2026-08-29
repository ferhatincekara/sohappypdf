"use client";

import { ClockIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PUBLIC_ANONYMOUS_RETENTION_HOURS } from "@/features/public-tools/lib/anonymous-limits";

export function ToolExpiredState({
  title,
  description,
  resetLabel,
  onReset,
}: {
  title?: string;
  description?: string;
  resetLabel?: string;
  onReset: () => void;
}) {
  const t = useTranslations("publicTools");

  return (
    <div className="flex flex-col gap-4" role="status" aria-live="polite">
      <div className="flex items-start gap-3">
        <ClockIcon
          className="mt-0.5 size-5 text-foreground"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-extrabold tracking-tight text-foreground">
            {title ?? t("expiration.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            {description ??
              t("expiration.description", {
                hours: PUBLIC_ANONYMOUS_RETENTION_HOURS,
              })}
          </p>
          <div className="mt-4 hidden md:block">
            <Button type="button" size="lg" onClick={onReset}>
              {resetLabel ?? t("actions.startAgain")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
