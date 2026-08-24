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
import {
  parseOrganizeOrderInput,
  parseSelectedPagesInput,
} from "../lib/tool-workspace";
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
  const shell = dedicatedToolShellCopy({
    toolId: tool.id,
    t,
    splitSelectedCount: selectedPagesFromSplitRanges(
      workspace.workspaceState.splitRanges,
    ).length,
    organizePageCount:
      parseOrganizeOrderInput(workspace.workspaceState.pageOrder)?.length ?? 0,
    mergeFileCount: workspace.files.length,
    rotateSelectedCount:
      parseSelectedPagesInput(workspace.workspaceState.pageSelection)?.length ??
      0,
    rotationDegrees: workspace.workspaceState.rotationDegrees,
    removeSelectedCount:
      parseSelectedPagesInput(workspace.workspaceState.pagesToRemove)?.length ??
      0,
    errorKey: ux.status === "error" ? ux.error.key : null,
    hours: PUBLIC_ANONYMOUS_RETENTION_HOURS,
  });

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
          title={shell.processingTitle}
          hint={shell.processingHint}
        />
      ) : null}

      {ux.status === "success" ? (
        <ToolSuccessState
          state={ux}
          signupHref={signupPath(tool.route)}
          isAuthenticated={workspace.isAuthenticated}
          isDownloading={workspace.isDownloading}
          title={shell.successTitle}
          description={shell.successDescription}
          downloadLabel={shell.downloadLabel}
          resetLabel={shell.resetLabel}
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
          message={shell.errorMessage}
          resetLabel={shell.resetLabel}
          onRetry={() => {
            void workspace.onRetry();
          }}
          onReset={workspace.resetWorkspace}
        />
      ) : null}

      {ux.status === "expired" ? (
        <ToolExpiredState
          title={shell.expiredTitle}
          description={shell.expiredDescription}
          resetLabel={shell.resetLabel}
          onReset={workspace.resetWorkspace}
        />
      ) : null}

      <ToolMobileActionBar
        ux={ux}
        canProcess={workspace.canProcess}
        processLabel={processLabel}
        processHint={shell.processHint}
        isDownloading={workspace.isDownloading}
        downloadLabel={shell.downloadLabel}
        resetLabel={shell.resetLabel}
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

function dedicatedToolShellCopy({
  toolId,
  t,
  splitSelectedCount,
  organizePageCount,
  mergeFileCount,
  rotateSelectedCount,
  rotationDegrees,
  removeSelectedCount,
  errorKey,
  hours,
}: {
  toolId: string;
  t: ReturnType<typeof useTranslations>;
  splitSelectedCount: number;
  organizePageCount: number;
  mergeFileCount: number;
  rotateSelectedCount: number;
  rotationDegrees: number;
  removeSelectedCount: number;
  errorKey: PublicToolErrorKey | null;
  hours: number;
}): {
  processingTitle?: string;
  processingHint?: string;
  successTitle?: string;
  successDescription?: string;
  downloadLabel?: string;
  resetLabel?: string;
  expiredTitle?: string;
  expiredDescription?: string;
  processHint?: string | null;
  errorMessage?: string;
} {
  if (toolId === "split-pdf") {
    return {
      processingTitle: t("workspaces.split.processing"),
      processingHint: t("workspaces.split.processingHint"),
      successTitle: t("workspaces.split.successTitle"),
      successDescription: t("workspaces.split.successDescription"),
      downloadLabel: t("workspaces.split.download"),
      resetLabel: t("workspaces.split.splitAnother"),
      expiredTitle: t("workspaces.split.expiredTitle"),
      expiredDescription: t("workspaces.split.expiredDescription", { hours }),
      processHint:
        splitSelectedCount === 0
          ? t("workspaces.split.selectPrompt")
          : t("workspaces.split.output", { count: splitSelectedCount }),
      errorMessage:
        errorKey === null
          ? undefined
          : resolveSplitErrorMessage(errorKey, t, hours),
    };
  }

  if (toolId === "organize-pdf") {
    return {
      processingTitle: t("workspaces.organize.processing"),
      processingHint: t("workspaces.organize.processingHint"),
      successTitle: t("workspaces.organize.successTitle"),
      successDescription: t("workspaces.organize.successDescription"),
      downloadLabel: t("workspaces.organize.download"),
      resetLabel: t("workspaces.organize.organizeAnother"),
      expiredTitle: t("workspaces.organize.expiredTitle"),
      expiredDescription: t("workspaces.organize.expiredDescription", {
        hours,
      }),
      processHint:
        organizePageCount === 0
          ? t("workspaces.organize.selectPrompt")
          : t("workspaces.organize.outputCount", { count: organizePageCount }),
      errorMessage:
        errorKey === null
          ? undefined
          : resolveOrganizeErrorMessage(errorKey, t, hours),
    };
  }

  if (toolId === "merge-pdf") {
    return {
      processingTitle: t("workspaces.merge.processing"),
      processingHint: t("workspaces.merge.processingHint"),
      successTitle: t("workspaces.merge.successTitle"),
      successDescription: t("workspaces.merge.successDescription"),
      downloadLabel: t("workspaces.merge.download"),
      resetLabel: t("workspaces.merge.mergeAnother"),
      expiredTitle: t("workspaces.merge.expiredTitle"),
      expiredDescription: t("workspaces.merge.expiredDescription", { hours }),
      processHint:
        mergeFileCount < 2
          ? t("workspaces.merge.selectPrompt")
          : t("workspaces.merge.output", { count: mergeFileCount }),
      errorMessage:
        errorKey === null
          ? undefined
          : resolveMergeErrorMessage(errorKey, t, hours),
    };
  }

  if (toolId === "rotate-pdf") {
    return {
      processingTitle: t("workspaces.rotate.processing"),
      processingHint: t("workspaces.rotate.processingHint"),
      successTitle: t("workspaces.rotate.successTitle"),
      successDescription: t("workspaces.rotate.successDescription"),
      downloadLabel: t("workspaces.rotate.download"),
      resetLabel: t("workspaces.rotate.rotateAnother"),
      expiredTitle: t("workspaces.rotate.expiredTitle"),
      expiredDescription: t("workspaces.rotate.expiredDescription", { hours }),
      processHint:
        rotateSelectedCount === 0
          ? t("workspaces.rotate.selectPrompt")
          : t("workspaces.rotate.output", {
              count: rotateSelectedCount,
              degrees: rotationDegrees,
            }),
      errorMessage:
        errorKey === null
          ? undefined
          : resolveRotateErrorMessage(errorKey, t, hours),
    };
  }

  if (toolId === "remove-pages") {
    return {
      processingTitle: t("workspaces.remove.processing"),
      processingHint: t("workspaces.remove.processingHint"),
      successTitle: t("workspaces.remove.successTitle"),
      successDescription: t("workspaces.remove.successDescription"),
      downloadLabel: t("workspaces.remove.download"),
      resetLabel: t("workspaces.remove.removeAnother"),
      expiredTitle: t("workspaces.remove.expiredTitle"),
      expiredDescription: t("workspaces.remove.expiredDescription", { hours }),
      processHint:
        removeSelectedCount === 0
          ? t("workspaces.remove.selectPrompt")
          : t("workspaces.remove.output", { count: removeSelectedCount }),
      errorMessage:
        errorKey === null
          ? undefined
          : resolveRemoveErrorMessage(errorKey, t, hours),
    };
  }

  return {};
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

function resolveOrganizeErrorMessage(
  errorKey: PublicToolErrorKey,
  t: ReturnType<typeof useTranslations>,
  hours: number,
): string | undefined {
  if (errorKey === "processingFailed") {
    return t("workspaces.organize.processingFailed");
  }

  if (errorKey === "unsupported") {
    return t("workspaces.organize.invalidFile");
  }

  if (errorKey === "filesExpired") {
    return t("workspaces.organize.expiredDescription", { hours });
  }

  return undefined;
}

function resolveMergeErrorMessage(
  errorKey: PublicToolErrorKey,
  t: ReturnType<typeof useTranslations>,
  hours: number,
): string | undefined {
  if (errorKey === "processingFailed") {
    return t("workspaces.merge.processingFailed");
  }

  if (errorKey === "unsupported") {
    return t("workspaces.merge.invalidFile");
  }

  if (errorKey === "filesExpired") {
    return t("workspaces.merge.expiredDescription", { hours });
  }

  return undefined;
}

function resolveRotateErrorMessage(
  errorKey: PublicToolErrorKey,
  t: ReturnType<typeof useTranslations>,
  hours: number,
): string | undefined {
  if (errorKey === "processingFailed") {
    return t("workspaces.rotate.processingFailed");
  }

  if (errorKey === "unsupported") {
    return t("workspaces.rotate.invalidFile");
  }

  if (errorKey === "filesExpired") {
    return t("workspaces.rotate.expiredDescription", { hours });
  }

  return undefined;
}

function resolveRemoveErrorMessage(
  errorKey: PublicToolErrorKey,
  t: ReturnType<typeof useTranslations>,
  hours: number,
): string | undefined {
  if (errorKey === "processingFailed") {
    return t("workspaces.remove.processingFailed");
  }

  if (errorKey === "unsupported") {
    return t("workspaces.remove.invalidFile");
  }

  if (errorKey === "filesExpired") {
    return t("workspaces.remove.expiredDescription", { hours });
  }

  return undefined;
}
