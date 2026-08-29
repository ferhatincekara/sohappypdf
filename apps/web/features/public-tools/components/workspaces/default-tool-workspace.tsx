"use client";

import { useTranslations } from "next-intl";
import { ToolDropzone } from "@/features/public-tools/components/tool-dropzone";
import { ToolFileList } from "@/features/public-tools/components/tool-file-list";
import {
  ToolOptionsPanel,
  toolHasWorkspaceOptions,
} from "@/features/public-tools/components/tool-options-panel";
import { ToolSelectedActions } from "@/features/public-tools/components/tool-selected-actions";
import { resolveDefaultWorkspaceHeading } from "@/features/public-tools/lib/workspace-heading";
import type { ToolSelectedWorkspaceProps } from "@/features/public-tools/types/tool-selected-workspace";

export function DefaultToolWorkspace(props: ToolSelectedWorkspaceProps) {
  const t = useTranslations("publicTools");
  const headingKey = resolveDefaultWorkspaceHeading(props.tool.id);
  const hasOptions = toolHasWorkspaceOptions(props.tool.id);
  const blocked = props.state.error !== null;

  return (
    <div className="flex flex-col gap-6">
      {blocked ? null : (
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {t(headingKey)}
          </h2>
        </div>
      )}

      <ToolFileList
        files={props.state.files}
        reorderable={props.reorderable}
        disabled={props.disabled}
        awaitingSignIn={props.awaitingSignIn === true}
        maxPagesPerFile={props.maxPagesPerFile}
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
          maxPagesPerFile={props.maxPagesPerFile}
          variant="compact"
          onSelectFiles={props.onSelectFiles}
        />
      ) : null}

      {hasOptions && !blocked ? (
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
        awaitingSignIn={props.awaitingSignIn === true}
        autoProcess={props.autoProcess}
        onProcess={props.onProcess}
      />
    </div>
  );
}
