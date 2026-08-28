"use client";

import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import type { ToolSelectedWorkspaceProps } from "../../types/tool-selected-workspace";
import { ToolDropzone } from "../tool-dropzone";
import { ToolSelectedActions } from "../tool-selected-actions";
import { MergeFileList } from "./merge-file-list";
import { MergeResultSummary } from "./merge-result-summary";

export function MergePdfWorkspace(props: ToolSelectedWorkspaceProps) {
  const t = useTranslations("publicTools");
  const [pageCounts, setPageCounts] = useState<Record<string, number>>({});
  const onPageCount = useCallback((id: string, pageCount: number | null) => {
    setPageCounts((current) => {
      if (pageCount === null) {
        if (!(id in current)) {
          return current;
        }

        const next = { ...current };
        delete next[id];
        return next;
      }

      if (current[id] === pageCount) {
        return current;
      }

      return { ...current, [id]: pageCount };
    });
  }, []);

  const totalPages = useMemo(
    () =>
      props.state.files.reduce(
        (sum, entry) => sum + (pageCounts[entry.id] ?? 0),
        0,
      ),
    [pageCounts, props.state.files],
  );

  const canMerge = props.canProcess && props.state.files.length >= 2;
  const blocked = props.state.error !== null;

  return (
    <div className="flex flex-col gap-6">
      {blocked ? null : (
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {t("workspaces.merge.title")}
          </h2>
          <p className="text-sm text-muted-foreground text-pretty">
            {t("workspaces.merge.hint")}
          </p>
        </div>
      )}

      <MergeFileList
        files={props.state.files}
        disabled={props.disabled}
        maxPagesPerFile={props.maxPagesPerFile}
        onMove={props.onMove}
        onReorder={props.onReorder}
        onRemove={props.onRemove}
        onRetry={props.onRetryUpload}
        onPageCount={onPageCount}
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

      {blocked ? null : (
        <MergeResultSummary
          fileCount={props.state.files.length}
          pageCount={totalPages}
          fileNames={props.state.files.map((entry) => entry.file.name)}
        />
      )}

      <ToolSelectedActions
        toolRoute={props.tool.route}
        state={props.state}
        canProcess={canMerge}
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
