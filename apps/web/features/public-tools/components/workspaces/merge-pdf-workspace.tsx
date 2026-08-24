"use client";

import { useTranslations } from "next-intl";
import type { ToolSelectedWorkspaceProps } from "../../types/tool-selected-workspace";
import { ToolDropzone } from "../tool-dropzone";
import { ToolFileList } from "../tool-file-list";
import { ToolSelectedActions } from "../tool-selected-actions";

export function MergePdfWorkspace(props: ToolSelectedWorkspaceProps) {
  const t = useTranslations("publicTools");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          {t("workspaces.merge.title")}
        </h2>
        <p className="text-sm text-muted-foreground text-pretty">
          {t("workspaces.merge.hint")}
        </p>
      </div>

      <ToolFileList
        files={props.state.files}
        reorderable={props.reorderable}
        disabled={props.disabled}
        onMove={props.onMove}
        onReorder={props.onReorder}
        onRemove={props.onRemove}
        onRetry={props.onRetryUpload}
      />

      {props.canAddFiles ? (
        <ToolDropzone
          accept={props.accept}
          multiple={props.multiple}
          disabled={props.disabled}
          formatsLabel={props.formatsLabel}
          maxSizeLabel={props.maxSizeLabel}
          variant="compact"
          onSelectFiles={props.onSelectFiles}
        />
      ) : null}

      <ToolSelectedActions
        toolRoute={props.tool.route}
        state={props.state}
        canProcess={props.canProcess}
        processLabel={props.processLabel}
        disabledReason={
          props.state.files.length < 2
            ? t("workspaces.merge.selectPrompt")
            : null
        }
        onProcess={props.onProcess}
      />
    </div>
  );
}
