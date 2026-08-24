"use client";

import type { ToolDefinition } from "@repo/tools/catalog";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { signupPath } from "@/features/auth/paths";
import { formatFileSize } from "@/features/files/lib/format-file-size";
import { usePublicToolWorkspace } from "../hooks/use-public-tool-workspace";
import { formatAcceptedFormats } from "../lib/format-labels";
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

      {ux.status === "processing" ? <ToolProcessingState state={ux} /> : null}

      {ux.status === "success" ? (
        <ToolSuccessState
          state={ux}
          signupHref={signupPath(tool.route)}
          isAuthenticated={workspace.isAuthenticated}
          isDownloading={workspace.isDownloading}
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
          onRetry={() => {
            void workspace.onRetry();
          }}
          onReset={workspace.resetWorkspace}
        />
      ) : null}

      {ux.status === "expired" ? (
        <ToolExpiredState onReset={workspace.resetWorkspace} />
      ) : null}

      <ToolMobileActionBar
        ux={ux}
        canProcess={workspace.canProcess}
        processLabel={processLabel}
        isDownloading={workspace.isDownloading}
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
