"use client";

import { useTranslations } from "next-intl";
import {
  isIndeterminateProcessingPhase,
  type ToolProcessingPhase,
} from "../lib/processing-phase";

const VISIBLE_PHASES = [
  "uploading",
  "preparing",
  "processing",
  "ready",
] as const;

export function ToolProcessingStatus({
  phase,
}: {
  phase: ToolProcessingPhase;
}) {
  const t = useTranslations("publicTools.phases");

  if (phase === "idle" || phase === "failed") {
    return null;
  }

  const activeIndex = VISIBLE_PHASES.indexOf(phase);
  const indeterminate = isIndeterminateProcessingPhase(phase);

  return (
    <div
      className="rounded-lg border border-border bg-card p-4"
      aria-live="polite"
      aria-busy={phase !== "ready"}
    >
      <p className="text-sm font-medium text-foreground">{t(phase)}</p>
      <p className="mt-1 text-sm text-muted-foreground">{t(`${phase}Hint`)}</p>
      {indeterminate ? (
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label={t(phase)}
        >
          <div className="h-full w-1/3 rounded-full bg-foreground motion-safe:animate-pulse motion-reduce:w-full" />
        </div>
      ) : null}
      <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {VISIBLE_PHASES.map((step, index) => {
          const isComplete =
            activeIndex > index || (phase === "ready" && step === "ready");
          const isCurrent = step === phase;

          return (
            <li
              key={step}
              className={
                isCurrent
                  ? "text-sm font-medium text-foreground"
                  : isComplete
                    ? "text-sm text-foreground"
                    : "text-sm text-muted-foreground"
              }
            >
              {t(step)}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
