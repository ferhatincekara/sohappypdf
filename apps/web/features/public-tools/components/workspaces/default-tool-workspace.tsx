"use client";

import { useTranslations } from "next-intl";
import { resolveDefaultWorkspaceHeading } from "../../lib/workspace-heading";
import type { ToolSelectedWorkspaceProps } from "../../types/tool-selected-workspace";
import { ToolDropzone } from "../tool-dropzone";
import { ToolFileList } from "../tool-file-list";
import {
  ToolOptionsPanel,
  toolHasWorkspaceOptions,
} from "../tool-options-panel";
import { ToolSelectedActions } from "../tool-selected-actions";

export function DefaultToolWorkspace(props: ToolSelectedWorkspaceProps) {
  const t = useTranslations("publicTools");
  const headingKey = resolveDefaultWorkspaceHeading(props.tool.id);
  const hasOptions = toolHasWorkspaceOptions(props.tool.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          {t(headingKey)}
        </h2>
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

      {hasOptions ? (
        <ToolOptionsPanel
          tool={props.tool}
          state={props.workspaceState}
          onChange={props.setWorkspaceState}
          disabled={props.disabled}
        />
      ) : null}

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
