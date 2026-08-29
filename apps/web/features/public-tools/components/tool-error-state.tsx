"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { loginPath } from "@/features/auth/paths";
import { ToolUpgradeCard } from "@/features/public-tools/components/tool-upgrade-card";
import { isPlanUpgradeToolError } from "@/features/public-tools/lib/public-tool-errors";
import type { ToolErrorUxState } from "@/features/public-tools/types/tool-ux-state";
import { Link } from "@/lib/i18n/navigation";

export function ToolErrorState({
  state,
  toolRoute,
  message,
  resetLabel,
  onRetry,
  onReset,
}: {
  state: ToolErrorUxState;
  toolRoute: `/${string}`;
  message?: string;
  resetLabel?: string;
  onRetry: () => void;
  onReset: () => void;
}) {
  const t = useTranslations("publicTools");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const upgrade = isPlanUpgradeToolError(state.error.key);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  if (upgrade) {
    return (
      <div className="flex flex-col gap-4" role="alert" aria-live="assertive">
        <ToolUpgradeCard errorKey={state.error.key} />
        <div className="hidden md:block">
          <Button type="button" size="lg" variant="outline" onClick={onReset}>
            {resetLabel ?? t("actions.startAgain")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" role="alert" aria-live="assertive">
      <div className="flex flex-col gap-2">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-lg font-extrabold tracking-tight text-foreground outline-none"
        >
          {t("errors.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {message ?? t(`errors.${state.error.key}`)}
        </p>
        <p className="text-sm text-muted-foreground">
          {state.error.retryable
            ? t("errors.retryHint")
            : t("errors.startAgainHint")}
        </p>
        {state.error.key === "signInRequired" ? (
          <p className="text-sm">
            <Link
              href={loginPath(toolRoute)}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {t("errors.signInCta")}
            </Link>
          </p>
        ) : null}
      </div>
      <div className="hidden flex-col gap-2 sm:flex-row md:flex">
        {state.error.retryable ? (
          <Button type="button" size="lg" onClick={onRetry}>
            {t("actions.retry")}
          </Button>
        ) : null}
        <Button
          type="button"
          size="lg"
          variant={state.error.retryable ? "outline" : "default"}
          onClick={onReset}
        >
          {resetLabel ?? t("actions.startAgain")}
        </Button>
      </div>
    </div>
  );
}
