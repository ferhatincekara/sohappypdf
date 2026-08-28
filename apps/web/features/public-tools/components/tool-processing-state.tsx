"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { estimateProcessingPercent } from "../lib/estimate-processing-progress";
import type {
  ToolProcessingStatus,
  ToolProcessingUxState,
} from "../types/tool-ux-state";

export function ToolProcessingState({
  state,
  title,
  hint,
}: {
  state: ToolProcessingUxState;
  title?: string;
  hint?: string;
}) {
  const t = useTranslations("publicTools.states.processing");
  const tUpload = useTranslations("files.upload");
  const status: ToolProcessingStatus = state.processingStatus;
  const heading = title ?? t(status);
  const detail = hint ?? t(`${status}Hint`);
  const percent = useDisplayedProcessingPercent(state);

  return (
    <div
      className="flex flex-col gap-3"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <h2 className="sr-only">{t("status")}</h2>
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-lg font-extrabold tracking-tight text-foreground">
          {heading}
        </p>
        <p className="shrink-0 text-lg font-extrabold tracking-tight tabular-nums text-foreground">
          {tUpload("percent", { value: percent })}
        </p>
      </div>
      <p className="text-sm text-muted-foreground">{detail}</p>
      <div
        className="mt-1 h-2.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={heading}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={tUpload("percent", { value: percent })}
      >
        <div
          className="h-full rounded-full bg-foreground motion-safe:transition-[width] motion-safe:duration-150"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function useDisplayedProcessingPercent(state: ToolProcessingUxState): number {
  const startedAtRef = useRef(Date.now());
  const processingStartedAtRef = useRef<number | null>(null);
  const displayedRef = useRef(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAtRef.current);
    }, 120);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  if (state.progress !== null && state.progress >= 0 && state.progress <= 100) {
    const actual = Math.round(state.progress);
    displayedRef.current = actual;
    return actual;
  }

  if (state.processingStatus === "processing") {
    processingStartedAtRef.current ??= Date.now();
  } else {
    processingStartedAtRef.current = null;
  }

  const statusElapsedMs =
    state.processingStatus === "processing" &&
    processingStartedAtRef.current !== null
      ? Date.now() - processingStartedAtRef.current
      : elapsedMs;
  const next = estimateProcessingPercent(
    state.processingStatus,
    statusElapsedMs,
  );
  const percent = Math.max(displayedRef.current, next);
  displayedRef.current = percent;

  return percent;
}
