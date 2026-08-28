"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { CompressionLevel } from "../../lib/tool-workspace";
import type { ToolSelectedWorkspaceProps } from "../../types/tool-selected-workspace";
import { ToolSelectedActions } from "../tool-selected-actions";
import { ToolWorkspaceFiles } from "../tool-workspace-files";

const LEVELS: readonly CompressionLevel[] = ["high", "medium", "low"];

export function CompressPdfWorkspace(props: ToolSelectedWorkspaceProps) {
  const t = useTranslations("publicTools");
  const entry = props.state.files[0];

  if (entry === undefined) {
    return null;
  }

  const blocked = props.state.error !== null;

  return (
    <div className="flex flex-col gap-6">
      <ToolWorkspaceFiles props={props} />

      {blocked ? null : (
        <>
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
            <div className="flex flex-col divide-y divide-border">
              {LEVELS.map((level) => {
                const selected =
                  props.workspaceState.compressionLevel === level;
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
                      "flex flex-col items-start gap-1 py-4 text-left outline-none transition-opacity",
                      selected ? "opacity-100" : "opacity-55 hover:opacity-100",
                    )}
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {t(`workspaces.compress.${level}.title`)}
                    </p>
                    <p className="text-sm text-muted-foreground text-pretty">
                      {t(`workspaces.compress.${level}.hint`)}
                    </p>
                    <p className="text-xs font-medium text-foreground/80">
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
        </>
      )}

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
