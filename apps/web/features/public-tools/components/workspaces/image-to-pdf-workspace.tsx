"use client";

import { useTranslations } from "next-intl";
import { ToolSelectedActions } from "@/features/public-tools/components/tool-selected-actions";
import { ToolWorkspaceFiles } from "@/features/public-tools/components/tool-workspace-files";
import { ConvertFormatBar } from "@/features/public-tools/components/workspaces/convert-format-bar";
import type { ToolSelectedWorkspaceProps } from "@/features/public-tools/types/tool-selected-workspace";

export function ImageToPdfWorkspace(props: ToolSelectedWorkspaceProps) {
  const t = useTranslations("publicTools");
  const entry = props.state.files[0];
  const sourceFormat = props.tool.inputFormats[0] ?? "jpg";

  if (entry === undefined) {
    return null;
  }

  const blocked = props.state.error !== null;

  return (
    <div className="flex flex-col gap-6">
      {blocked ? null : (
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {t("workspaces.imageToPdf.title")}
          </h2>
          <p className="text-sm text-muted-foreground text-pretty">
            {t("workspaces.imageToPdf.hint")}
          </p>
        </div>
      )}

      <ToolWorkspaceFiles props={props} />

      {blocked ? null : (
        <>
          <ConvertFormatBar
            sourceFormat={sourceFormat}
            targetFormat="pdf"
            showFree={props.tool.availableOnPlans.includes("free")}
          />

          <p className="text-sm font-medium text-foreground" aria-live="polite">
            {t("workspaces.imageToPdf.output")}
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
