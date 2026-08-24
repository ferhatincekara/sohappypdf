"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { CompressionLevel } from "../../lib/tool-workspace";
import type { ToolSelectedWorkspaceProps } from "../../types/tool-selected-workspace";
import { ToolFileCard } from "../tool-file-card";
import { ToolSelectedActions } from "../tool-selected-actions";

const LEVELS: readonly CompressionLevel[] = ["high", "medium", "low"];

export function CompressPdfWorkspace(props: ToolSelectedWorkspaceProps) {
  const t = useTranslations("publicTools");
  const entry = props.state.files[0];

  if (entry === undefined) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <ToolFileCard
        entry={entry}
        accept={props.accept}
        disabled={props.disabled}
        onRemove={() => {
          props.onRemove(entry.id);
        }}
        onReplace={props.onReplaceFiles}
        onRetry={() => {
          props.onRetryUpload(entry.id);
        }}
      />

      <section
        className="flex flex-col gap-3"
        aria-labelledby="compress-heading"
      >
        <div className="flex flex-col gap-1">
          <h2
            id="compress-heading"
            className="text-base font-semibold tracking-tight text-foreground"
          >
            {t("workspaces.compress.title")}
          </h2>
          <p className="text-sm text-muted-foreground text-pretty">
            {t("workspaces.compress.hint")}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {LEVELS.map((level) => {
            const selected = props.workspaceState.compressionLevel === level;
            return (
              <button
                key={level}
                type="button"
                disabled={props.disabled}
                aria-pressed={selected}
                onClick={() => {
                  props.setWorkspaceState({
                    ...props.workspaceState,
                    compressionLevel: level,
                  });
                }}
                className={cn(
                  "rounded-xl border p-4 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                  selected
                    ? "border-foreground bg-card shadow-xs"
                    : "border-border bg-card/60 hover:bg-muted/40",
                )}
              >
                <p className="text-sm font-medium text-foreground">
                  {t(`workspaces.compress.${level}.title`)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground text-pretty">
                  {t(`workspaces.compress.${level}.hint`)}
                </p>
                <p className="mt-2 text-xs font-medium text-foreground/80">
                  {t(`workspaces.compress.${level}.outcome`)}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <p className="text-sm font-medium text-foreground" aria-live="polite">
        {t("workspaces.compress.output", {
          level: t(
            `workspaces.compress.${props.workspaceState.compressionLevel}.title`,
          ),
        })}
      </p>

      <ToolSelectedActions
        toolRoute={props.tool.route}
        state={props.state}
        canProcess={props.canProcess}
        processLabel={props.processLabel}
        onProcess={props.onProcess}
      />
    </div>
  );
}
