"use client";

import { useTranslations } from "next-intl";
import type { ToolSelectedWorkspaceProps } from "../../types/tool-selected-workspace";
import { ToolSelectedActions } from "../tool-selected-actions";
import { ToolWorkspaceFiles } from "../tool-workspace-files";

export function RepairPdfWorkspace(props: ToolSelectedWorkspaceProps) {
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
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              {t("workspaces.repair.title")}
            </h2>
            <p className="text-sm text-muted-foreground text-pretty">
              {t("workspaces.repair.hint")}
            </p>
          </div>
          <ol className="divide-y divide-border">
            {(["analyze", "repair", "download"] as const).map((step, index) => (
              <li key={step} className="flex gap-3 py-4">
                <span className="w-5 shrink-0 pt-0.5 text-sm font-extrabold tabular-nums text-foreground">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {t(`workspaces.repair.steps.${step}.title`)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground text-pretty">
                    {t(`workspaces.repair.steps.${step}.description`)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className="text-sm font-medium text-foreground">
            {t("workspaces.repair.output")}
          </p>
        </>
      )}
      <ToolSelectedActions
        toolRoute={props.tool.route}
        state={props.state}
        canProcess={props.canProcess}
        processLabel={props.processLabel}
        autoProcess={props.autoProcess}
        onProcess={props.onProcess}
      />
    </div>
  );
}
