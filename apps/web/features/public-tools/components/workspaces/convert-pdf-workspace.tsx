"use client";

import { useTranslations } from "next-intl";
import { convertHintKey } from "../../lib/convert-hint";
import type { ToolSelectedWorkspaceProps } from "../../types/tool-selected-workspace";
import { ToolFileCard } from "../tool-file-card";
import { ToolSelectedActions } from "../tool-selected-actions";
import { ConvertResultSummary } from "./convert-result-summary";

export function ConvertPdfWorkspace(props: ToolSelectedWorkspaceProps) {
  const t = useTranslations("publicTools");
  const entry = props.state.files[0];
  const sourceFormat = props.tool.inputFormats[0] ?? "pdf";
  const targetFormat = props.tool.outputFormats[0] ?? "pdf";

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

      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          {t("workspaces.convert.title")}
        </h2>
        <p className="text-sm text-muted-foreground text-pretty">
          {t(`workspaces.convert.${convertHintKey(props.tool.id)}`)}
        </p>
      </div>

      <ConvertResultSummary
        sourceFormat={sourceFormat}
        targetFormat={targetFormat}
      />

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
