"use client";

import type { ToolDefinition } from "@repo/tools/catalog";
import { useTranslations } from "next-intl";
import { signupPath } from "@/features/auth/paths";
import { formatFileSize } from "@/features/files/lib/format-file-size";
import { usePublicToolWorkspace } from "../hooks/use-public-tool-workspace";
import { formatAcceptedFormats } from "../lib/format-labels";
import { acceptForTool } from "../lib/tool-limits";
import { ToolEmptyState } from "./tool-empty-state";
import { ToolErrorState } from "./tool-error-state";
import { ToolExpiredState } from "./tool-expired-state";
import { ToolMobileActionBar } from "./tool-mobile-action-bar";
import {
  ToolOptionsPanel,
  toolHasWorkspaceOptions,
} from "./tool-options-panel";
import { ToolProcessingState } from "./tool-processing-state";
import { ToolSelectedState } from "./tool-selected-state";
import { ToolSuccessState } from "./tool-success-state";

function processActionKey(toolId: string): "merge" | "split" | "process" {
  if (toolId === "merge-pdf") {
    return "merge";
  }

  if (toolId === "split-pdf") {
    return "split";
  }

  return "process";
}

export function PublicToolWorkspace({ tool }: { tool: ToolDefinition }) {
  const t = useTranslations("publicTools");
  const workspace = usePublicToolWorkspace(tool);
  const formatsLabel = formatAcceptedFormats(
    tool.inputFormats,
    t("upload.conjunction"),
  );
  const maxSizeLabel = formatFileSize(workspace.maxFileSizeBytes);
  const accept = acceptForTool(tool);
  const processLabel = t(processActionKey(tool.id));
  const hasOptions = toolHasWorkspaceOptions(tool.id);
  const { ux } = workspace;

  if (workspace.isSessionPending) {
    return (
      <div className="rounded-lg border border-border bg-card p-8">
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  const options =
    ux.status === "selected" && hasOptions ? (
      <section
        aria-labelledby="tool-options-heading"
        className="rounded-lg border border-border bg-card p-4"
      >
        <h2
          id="tool-options-heading"
          className="text-sm font-medium text-foreground"
        >
          {t("workspace.options")}
        </h2>
        <div className="mt-3">
          <ToolOptionsPanel
            tool={tool}
            state={workspace.workspaceState}
            onChange={workspace.setWorkspaceState}
            disabled={false}
          />
        </div>
      </section>
    ) : null;

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

      {ux.status === "selected" ? (
        <ToolSelectedState
          toolRoute={tool.route}
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
          options={options}
          onSelectFiles={workspace.addFiles}
          onMove={workspace.onMove}
          onReorder={workspace.onReorder}
          onRemove={workspace.onRemove}
          onRetryUpload={workspace.onRetryUpload}
          onProcess={() => {
            void workspace.onProcess();
          }}
        />
      ) : null}

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
