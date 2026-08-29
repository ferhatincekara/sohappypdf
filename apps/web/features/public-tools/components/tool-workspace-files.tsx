"use client";

import { ToolDropzone } from "@/features/public-tools/components/tool-dropzone";
import { ToolFileCard } from "@/features/public-tools/components/tool-file-card";
import { ToolFileList } from "@/features/public-tools/components/tool-file-list";
import type { ToolSelectedWorkspaceProps } from "@/features/public-tools/types/tool-selected-workspace";

export function ToolWorkspaceFiles({
  props,
  pageCount,
}: {
  props: ToolSelectedWorkspaceProps;
  pageCount?: number | null;
}) {
  const entry = props.state.files[0];
  const showList = props.multiple || props.state.files.length > 1;

  if (!showList) {
    if (entry === undefined) {
      return null;
    }

    return (
      <ToolFileCard
        entry={entry}
        pageCount={pageCount}
        accept={props.accept}
        disabled={props.disabled}
        maxPagesPerFile={props.maxPagesPerFile}
        onRemove={() => {
          props.onRemove(entry.id);
        }}
        onReplace={props.onReplaceFiles}
        onRetry={() => {
          props.onRetryUpload(entry.id);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
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
    </div>
  );
}
