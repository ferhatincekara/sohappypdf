"use client";

import type { ToolDefinition } from "@repo/tools/catalog";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { signupPath } from "@/features/auth/paths";
import { formatFileSize } from "@/features/files/lib/format-file-size";
import { usePublicToolWorkspace } from "../hooks/use-public-tool-workspace";
import { PUBLIC_ANONYMOUS_RETENTION_HOURS } from "../lib/anonymous-limits";
import { formatAcceptedFormats } from "../lib/format-labels";
import type { PublicToolErrorKey } from "../lib/public-tool-errors";
import { selectedPagesFromSplitRanges } from "../lib/split-selection";
import { acceptForTool } from "../lib/tool-limits";
import type { ToolSelectedUxState } from "../types/tool-ux-state";
import { ToolEmptyState } from "./tool-empty-state";
import { ToolErrorState } from "./tool-error-state";
import { ToolExpiredState } from "./tool-expired-state";
import { ToolMobileActionBar } from "./tool-mobile-action-bar";
import { ToolProcessingState } from "./tool-processing-state";
import { ToolSuccessState } from "./tool-success-state";
import { SelectedToolWorkspace } from "./workspaces/selected-tool-workspace";

export type PublicToolSelectedSlot = {
  defaultSelected: ReactNode;
  state: ToolSelectedUxState;
};

export function PublicToolWorkspace({
  tool,
  renderSelected,
}: {
  tool: ToolDefinition;
  renderSelected?: (slot: PublicToolSelectedSlot) => ReactNode;
}) {
  const t = useTranslations("publicTools");
  const tTools = useTranslations("tools");
  const workspace = usePublicToolWorkspace(tool);
  const formatsLabel = formatAcceptedFormats(
    tool.inputFormats,
    t("upload.conjunction"),
  );
  const maxSizeLabel = formatFileSize(workspace.maxFileSizeBytes);
  const accept = acceptForTool(tool);
  const processLabel = tTools(`${tool.id}.name`);
  const { ux } = workspace;
  const isSplit = tool.id === "split-pdf";
  const splitSelectedCount = isSplit
    ? selectedPagesFromSplitRanges(workspace.workspaceState.splitRanges).length
    : 0;
  const splitProcessHint = isSplit
    ? splitSelectedCount === 0
      ? t("workspaces.split.selectPrompt")
      : t("workspaces.split.output", { count: splitSelectedCount })
    : null;
  const splitResetLabel = isSplit
    ? t("workspaces.split.splitAnother")
    : undefined;
  const splitDownloadLabel = isSplit
    ? t("workspaces.split.download")
    : undefined;
  const splitErrorMessage =
    isSplit && ux.status === "error"
      ? resolveSplitErrorMessage(
          ux.error.key,
          t,
          PUBLIC_ANONYMOUS_RETENTION_HOURS,
        )
      : undefined;

  if (workspace.isSessionPending) {
    return (
      <div className="rounded-xl border border-border bg-card p-8">
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  const defaultSelected =
    ux.status === "selected" ? (
      <SelectedToolWorkspace
        tool={tool}
        state={ux}
        accept={accept}
        multiple={workspace.maxFiles > 1}
        canAddFiles={workspace.files.length < workspace.maxFiles}
        formatsLabel={formatsLabel}
        maxSizeLabel={maxSizeLabel}
        reorderable={workspace.reorderable}
        disabled={workspace.isBusy}
        canProcess={workspace.canProcess}
        processLabel={processLabel}
        workspaceState={workspace.workspaceState}
        setWorkspaceState={workspace.setWorkspaceState}
        onSelectFiles={workspace.addFiles}
        onReplaceFiles={workspace.replaceFiles}
        onMove={workspace.onMove}
        onReorder={workspace.onReorder}
        onRemove={workspace.onRemove}
        onRetryUpload={workspace.onRetryUpload}
        onProcess={() => {
          void workspace.onProcess();
        }}
      />
    ) : null;

  const selected =
    ux.status === "selected" && defaultSelected !== null
      ? (renderSelected?.({
          defaultSelected,
          state: ux,
        }) ?? defaultSelected)
      : null;

  return (
    <div className="flex flex-col gap-6 pb-28 md:pb-0">
      {ux.status === "empty" ? (
        <ToolEmptyState
          accept={accept}
          multiple={workspace.maxFiles > 1}
          formatsLabel={formatsLabel}
          maxSizeLabel={maxSizeLabel}
          onSelectFiles={workspace.addFiles}
        />
      ) : null}

      {selected}

      {ux.status === "processing" ? (
        <ToolProcessingState
          state={ux}
          title={isSplit ? t("workspaces.split.processing") : undefined}
          hint={isSplit ? t("workspaces.split.processingHint") : undefined}
        />
      ) : null}

      {ux.status === "success" ? (
        <ToolSuccessState
          state={ux}
          signupHref={signupPath(tool.route)}
          isAuthenticated={workspace.isAuthenticated}
          isDownloading={workspace.isDownloading}
          title={isSplit ? t("workspaces.split.successTitle") : undefined}
          description={
            isSplit ? t("workspaces.split.successDescription") : undefined
          }
          downloadLabel={splitDownloadLabel}
          resetLabel={splitResetLabel}
          onDownload={() => {
            void workspace.onDownload();
          }}
          onReset={workspace.resetWorkspace}
        />
      ) : null}

      {ux.status === "error" ? (
        <ToolErrorState
          state={ux}
          toolRoute={tool.route}
          message={splitErrorMessage}
          resetLabel={splitResetLabel}
          onRetry={() => {
            void workspace.onRetry();
          }}
          onReset={workspace.resetWorkspace}
        />
      ) : null}

      {ux.status === "expired" ? (
        <ToolExpiredState
          title={isSplit ? t("workspaces.split.expiredTitle") : undefined}
          description={
            isSplit
              ? t("workspaces.split.expiredDescription", {
                  hours: PUBLIC_ANONYMOUS_RETENTION_HOURS,
                })
              : undefined
          }
          resetLabel={splitResetLabel}
          onReset={workspace.resetWorkspace}
        />
      ) : null}

      <ToolMobileActionBar
        ux={ux}
        canProcess={workspace.canProcess}
        processLabel={processLabel}
        processHint={splitProcessHint}
        isDownloading={workspace.isDownloading}
        downloadLabel={splitDownloadLabel}
        resetLabel={splitResetLabel}
        maxFiles={workspace.maxFiles}
        maxFileSizeBytes={workspace.maxFileSizeBytes}
        onProcess={() => {
          void workspace.onProcess();
        }}
        onDownload={() => {
          void workspace.onDownload();
        }}
        onRetry={() => {
          void workspace.onRetry();
        }}
        onReset={workspace.resetWorkspace}
      />
    </div>
  );
}

function resolveSplitErrorMessage(
  errorKey: PublicToolErrorKey,
  t: ReturnType<typeof useTranslations>,
  hours: number,
): string | undefined {
  if (errorKey === "processingFailed") {
    return t("workspaces.split.processingFailed");
  }

  if (errorKey === "unsupported") {
    return t("workspaces.split.invalidFile");
  }

  if (errorKey === "filesExpired") {
    return t("workspaces.split.expiredDescription", { hours });
  }

  return undefined;
}
