"use client";

import { AlertCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { loginPath } from "@/features/auth/paths";
import { Link } from "@/lib/i18n/navigation";
import type { ToolErrorUxState } from "../types/tool-ux-state";

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

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div
      className="rounded-lg border border-border bg-card p-5"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <AlertCircleIcon
          className="mt-0.5 size-5 text-destructive"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-base font-semibold text-foreground outline-none"
          >
            {t("errors.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {message ?? t(`errors.${state.error.key}`)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {state.error.retryable
              ? t("errors.retryHint")
              : t("errors.startAgainHint")}
          </p>
          {state.error.key === "signInRequired" ? (
            <p className="mt-2 text-sm">
              <Link
                href={loginPath(toolRoute)}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {t("errors.signInCta")}
              </Link>
            </p>
          ) : null}
          <div className="mt-4 hidden flex-col gap-2 sm:flex-row md:flex">
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
      </div>
    </div>
  );
}
