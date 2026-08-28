"use client";

import { useTranslations } from "next-intl";
import { convertHintKey } from "../../lib/convert-hint";
import type { ToolSelectedWorkspaceProps } from "../../types/tool-selected-workspace";
import { ToolSelectedActions } from "../tool-selected-actions";
import { ToolWorkspaceFiles } from "../tool-workspace-files";
import { ConvertFormatBar } from "./convert-format-bar";

export function ConvertPdfWorkspace(props: ToolSelectedWorkspaceProps) {
  const t = useTranslations("publicTools");
  const entry = props.state.files[0];
  const sourceFormat = props.tool.inputFormats[0] ?? "pdf";
  const targetFormat = props.tool.outputFormats[0] ?? "pdf";

  if (entry === undefined) {
    return null;
  }

  const blocked = props.state.error !== null;
  const showFree = props.tool.availableOnPlans.includes("free");

  return (
    <div className="flex flex-col gap-6">
      <ToolWorkspaceFiles props={props} />

      {blocked ? null : (
        <>
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              {t("workspaces.convert.title")}
            </h2>
            <p className="text-sm text-muted-foreground text-pretty">
              {t(`workspaces.convert.${convertHintKey(props.tool.id)}`)}
            </p>
          </div>

          <ConvertFormatBar
            sourceFormat={sourceFormat}
            targetFormat={targetFormat}
            showFree={showFree}
          />
        </>
      )}

      <ToolSelectedActions
        toolRoute={props.tool.route}
        state={props.state}
        canProcess={props.canProcess}
        processLabel={t("workspaces.convert.cta")}
        autoProcess={props.autoProcess}
        onProcess={props.onProcess}
      />
    </div>
  );
}
