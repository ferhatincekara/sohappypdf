"use client";

import { useTranslations } from "next-intl";
import type {
  ToolProcessingStatus,
  ToolProcessingUxState,
} from "../types/tool-ux-state";

export function ToolProcessingState({
  state,
}: {
  state: ToolProcessingUxState;
}) {
  const t = useTranslations("publicTools.states.processing");
  const status: ToolProcessingStatus = state.processingStatus;
  const hasRealProgress =
    state.progress !== null && state.progress >= 0 && state.progress <= 100;

  return (
    <div
      className="rounded-lg border border-border bg-card p-5"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <h2 className="sr-only">{t("status")}</h2>
      <p className="text-sm font-medium text-foreground">{t(status)}</p>
      <p className="mt-1 text-sm text-muted-foreground">{t(`${status}Hint`)}</p>
      {hasRealProgress && state.progress !== null ? (
        <div
          className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label={t(status)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={state.progress}
        >
          <div
            className="h-full bg-foreground motion-safe:transition-[width] motion-safe:duration-150"
            style={{ width: `${state.progress}%` }}
          />
        </div>
      ) : (
        <div
          className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label={t(status)}
        >
          <div className="h-full w-1/3 rounded-full bg-foreground motion-safe:animate-pulse motion-reduce:w-full" />
        </div>
      )}
    </div>
  );
}
