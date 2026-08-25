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
  type CompressionLevel,
  parseOrganizeOrderInput,
  parseSelectedPagesInput,
} from "../lib/tool-workspace";
import { isConvertToolId } from "../lib/tool-workspace-kind";
import {
  isFileWorkspaceUx,
  type ToolSelectedUxState,
} from "../types/tool-ux-state";
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
    compressionLevel: workspace.workspaceState.compressionLevel,
    ocrOutput: workspace.workspaceState.outputFormat === "txt" ? "txt" : "pdf",
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

  const defaultSelected = isFileWorkspaceUx(ux) ? (
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
    isFileWorkspaceUx(ux) && defaultSelected !== null
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
  compressionLevel,
  ocrOutput,
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
  compressionLevel: CompressionLevel;
  ocrOutput: "pdf" | "txt";
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

  if (toolId === "extract-pages") {
    return {
      processingTitle: t("workspaces.extract.processing"),
      processingHint: t("workspaces.extract.processingHint"),
      successTitle: t("workspaces.extract.successTitle"),
      successDescription: t("workspaces.extract.successDescription"),
      downloadLabel: t("workspaces.extract.download"),
      resetLabel: t("workspaces.extract.extractAnother"),
      expiredTitle: t("workspaces.extract.expiredTitle"),
      expiredDescription: t("workspaces.extract.expiredDescription", {
        hours,
      }),
      processHint:
        splitSelectedCount === 0
          ? t("workspaces.extract.selectPrompt")
          : t("workspaces.extract.output", { count: splitSelectedCount }),
      errorMessage:
        errorKey === null
          ? undefined
          : resolveExtractErrorMessage(errorKey, t, hours),
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

  if (toolId === "compress-pdf") {
    return {
      processingTitle: t("workspaces.compress.processing"),
      processingHint: t("workspaces.compress.processingHint"),
      successTitle: t("workspaces.compress.successTitle"),
      successDescription: t("workspaces.compress.successDescription"),
      downloadLabel: t("workspaces.compress.download"),
      resetLabel: t("workspaces.compress.compressAnother"),
      expiredTitle: t("workspaces.compress.expiredTitle"),
      expiredDescription: t("workspaces.compress.expiredDescription", {
        hours,
      }),
      processHint: t("workspaces.compress.output", {
        level: t(`workspaces.compress.${compressionLevel}.title`),
      }),
      errorMessage:
        errorKey === null
          ? undefined
          : resolveCompressErrorMessage(errorKey, t, hours),
    };
  }

  if (isConvertToolId(toolId)) {
    return {
      processingTitle: t("workspaces.convert.processing"),
      processingHint: t("workspaces.convert.processingHint"),
      successTitle: t("workspaces.convert.successTitle"),
      successDescription: t("workspaces.convert.successDescription"),
      downloadLabel: t("workspaces.convert.download"),
      resetLabel: t("workspaces.convert.convertAnother"),
      expiredTitle: t("workspaces.convert.expiredTitle"),
      expiredDescription: t("workspaces.convert.expiredDescription", {
        hours,
      }),
      errorMessage:
        errorKey === null
          ? undefined
          : resolveConvertErrorMessage(errorKey, t, hours),
    };
  }

  if (toolId === "repair-pdf") {
    return {
      processingTitle: t("workspaces.repair.processing"),
      processingHint: t("workspaces.repair.processingHint"),
      successTitle: t("workspaces.repair.successTitle"),
      successDescription: t("workspaces.repair.successDescription"),
      downloadLabel: t("workspaces.repair.download"),
      resetLabel: t("workspaces.repair.repairAnother"),
      expiredTitle: t("workspaces.repair.expiredTitle"),
      expiredDescription: t("workspaces.repair.expiredDescription", { hours }),
      processHint: t("workspaces.repair.output"),
      errorMessage:
        errorKey === null
          ? undefined
          : resolveRepairErrorMessage(errorKey, t, hours),
    };
  }

  if (toolId === "ocr-pdf") {
    return {
      processingTitle: t("workspaces.ocr.processing"),
      processingHint: t("workspaces.ocr.processingHint"),
      successTitle: t("workspaces.ocr.successTitle"),
      successDescription: t("workspaces.ocr.successDescription"),
      downloadLabel: t("workspaces.ocr.download"),
      resetLabel: t("workspaces.ocr.ocrAnother"),
      expiredTitle: t("workspaces.ocr.expiredTitle"),
      expiredDescription: t("workspaces.ocr.expiredDescription", { hours }),
      processHint: t(`workspaces.ocr.output.${ocrOutput}`),
      errorMessage:
        errorKey === null
          ? undefined
          : resolveOcrErrorMessage(errorKey, t, hours),
    };
  }

  if (toolId === "protect-pdf") {
    return {
      processingTitle: t("workspaces.protect.processing"),
      processingHint: t("workspaces.protect.processingHint"),
      successTitle: t("workspaces.protect.successTitle"),
      successDescription: t("workspaces.protect.successDescription"),
      downloadLabel: t("workspaces.protect.download"),
      resetLabel: t("workspaces.protect.protectAnother"),
      expiredTitle: t("workspaces.protect.expiredTitle"),
      expiredDescription: t("workspaces.protect.expiredDescription", {
        hours,
      }),
      processHint: t("workspaces.protect.output"),
      errorMessage:
        errorKey === null
          ? undefined
          : resolveProtectErrorMessage(errorKey, t, hours),
    };
  }

  if (toolId === "unlock-pdf") {
    return {
      processingTitle: t("workspaces.unlock.processing"),
      processingHint: t("workspaces.unlock.processingHint"),
      successTitle: t("workspaces.unlock.successTitle"),
      successDescription: t("workspaces.unlock.successDescription"),
      downloadLabel: t("workspaces.unlock.download"),
      resetLabel: t("workspaces.unlock.unlockAnother"),
      expiredTitle: t("workspaces.unlock.expiredTitle"),
      expiredDescription: t("workspaces.unlock.expiredDescription", { hours }),
      processHint: t("workspaces.unlock.output"),
      errorMessage:
        errorKey === null
          ? undefined
          : resolveUnlockErrorMessage(errorKey, t, hours),
    };
  }

  if (toolId === "watermark-pdf") {
    return {
      processingTitle: t("workspaces.watermark.processing"),
      processingHint: t("workspaces.watermark.processingHint"),
      successTitle: t("workspaces.watermark.successTitle"),
      successDescription: t("workspaces.watermark.successDescription"),
      downloadLabel: t("workspaces.watermark.download"),
      resetLabel: t("workspaces.watermark.watermarkAnother"),
      expiredTitle: t("workspaces.watermark.expiredTitle"),
      expiredDescription: t("workspaces.watermark.expiredDescription", {
        hours,
      }),
      processHint: t("workspaces.watermark.output"),
      errorMessage:
        errorKey === null
          ? undefined
          : resolveWatermarkErrorMessage(errorKey, t, hours),
    };
  }

  if (toolId === "crop-pdf") {
    return {
      processingTitle: t("workspaces.crop.processing"),
      processingHint: t("workspaces.crop.processingHint"),
      successTitle: t("workspaces.crop.successTitle"),
      successDescription: t("workspaces.crop.successDescription"),
      downloadLabel: t("workspaces.crop.download"),
      resetLabel: t("workspaces.crop.cropAnother"),
      expiredTitle: t("workspaces.crop.expiredTitle"),
      expiredDescription: t("workspaces.crop.expiredDescription", { hours }),
      processHint: t("workspaces.crop.output"),
      errorMessage:
        errorKey === null
          ? undefined
          : resolveCropErrorMessage(errorKey, t, hours),
    };
  }

  if (toolId === "sign-pdf") {
    return {
      processingTitle: t("workspaces.sign.processing"),
      processingHint: t("workspaces.sign.processingHint"),
      successTitle: t("workspaces.sign.successTitle"),
      successDescription: t("workspaces.sign.successDescription"),
      downloadLabel: t("workspaces.sign.download"),
      resetLabel: t("workspaces.sign.signAnother"),
      expiredTitle: t("workspaces.sign.expiredTitle"),
      expiredDescription: t("workspaces.sign.expiredDescription", { hours }),
      processHint: t("workspaces.sign.output"),
      errorMessage:
        errorKey === null
          ? undefined
          : resolveSignErrorMessage(errorKey, t, hours),
    };
  }

  if (toolId === "pdf-forms") {
    return {
      processingTitle: t("workspaces.fill.processing"),
      processingHint: t("workspaces.fill.processingHint"),
      successTitle: t("workspaces.fill.successTitle"),
      successDescription: t("workspaces.fill.successDescription"),
      downloadLabel: t("workspaces.fill.download"),
      resetLabel: t("workspaces.fill.fillAnother"),
      expiredTitle: t("workspaces.fill.expiredTitle"),
      expiredDescription: t("workspaces.fill.expiredDescription", { hours }),
      processHint: t("workspaces.fill.output"),
      errorMessage:
        errorKey === null
          ? undefined
          : resolveFillErrorMessage(errorKey, t, hours),
    };
  }

  if (toolId === "edit-pdf") {
    return {
      processingTitle: t("workspaces.edit.processing"),
      processingHint: t("workspaces.edit.processingHint"),
      successTitle: t("workspaces.edit.successTitle"),
      successDescription: t("workspaces.edit.successDescription"),
      downloadLabel: t("workspaces.edit.download"),
      resetLabel: t("workspaces.edit.editAnother"),
      expiredTitle: t("workspaces.edit.expiredTitle"),
      expiredDescription: t("workspaces.edit.expiredDescription", { hours }),
      processHint: t("workspaces.edit.limitation"),
      errorMessage:
        errorKey === null
          ? undefined
          : resolveEditErrorMessage(errorKey, t, hours),
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

function resolveExtractErrorMessage(
  errorKey: PublicToolErrorKey,
  t: ReturnType<typeof useTranslations>,
  hours: number,
): string | undefined {
  if (errorKey === "processingFailed") {
    return t("workspaces.extract.processingFailed");
  }

  if (errorKey === "unsupported") {
    return t("workspaces.extract.invalidFile");
  }

  if (errorKey === "filesExpired") {
    return t("workspaces.extract.expiredDescription", { hours });
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

function resolveCompressErrorMessage(
  errorKey: PublicToolErrorKey,
  t: ReturnType<typeof useTranslations>,
  hours: number,
): string | undefined {
  if (errorKey === "processingFailed") {
    return t("workspaces.compress.processingFailed");
  }

  if (errorKey === "unsupported") {
    return t("workspaces.compress.invalidFile");
  }

  if (errorKey === "filesExpired") {
    return t("workspaces.compress.expiredDescription", { hours });
  }

  return undefined;
}

function resolveConvertErrorMessage(
  errorKey: PublicToolErrorKey,
  t: ReturnType<typeof useTranslations>,
  hours: number,
): string | undefined {
  if (errorKey === "processingFailed") {
    return t("workspaces.convert.processingFailed");
  }

  if (errorKey === "unsupported") {
    return t("workspaces.convert.invalidFile");
  }

  if (errorKey === "filesExpired") {
    return t("workspaces.convert.expiredDescription", { hours });
  }

  return undefined;
}

function resolveRepairErrorMessage(
  errorKey: PublicToolErrorKey,
  t: ReturnType<typeof useTranslations>,
  hours: number,
): string | undefined {
  if (errorKey === "processingFailed") {
    return t("workspaces.repair.processingFailed");
  }

  if (errorKey === "unsupported") {
    return t("workspaces.repair.invalidFile");
  }

  if (errorKey === "filesExpired") {
    return t("workspaces.repair.expiredDescription", { hours });
  }

  return undefined;
}

function resolveOcrErrorMessage(
  errorKey: PublicToolErrorKey,
  t: ReturnType<typeof useTranslations>,
  hours: number,
): string | undefined {
  if (errorKey === "processingFailed") {
    return t("workspaces.ocr.processingFailed");
  }

  if (errorKey === "unsupported") {
    return t("workspaces.ocr.invalidFile");
  }

  if (errorKey === "filesExpired") {
    return t("workspaces.ocr.expiredDescription", { hours });
  }

  return undefined;
}

function resolveProtectErrorMessage(
  errorKey: PublicToolErrorKey,
  t: ReturnType<typeof useTranslations>,
  hours: number,
): string | undefined {
  if (errorKey === "processingFailed") {
    return t("workspaces.protect.processingFailed");
  }

  if (errorKey === "unsupported") {
    return t("workspaces.protect.invalidFile");
  }

  if (errorKey === "filesExpired") {
    return t("workspaces.protect.expiredDescription", { hours });
  }

  return undefined;
}

function resolveUnlockErrorMessage(
  errorKey: PublicToolErrorKey,
  t: ReturnType<typeof useTranslations>,
  hours: number,
): string | undefined {
  if (errorKey === "passwordProtected") {
    return t("workspaces.unlock.wrongPassword");
  }

  if (errorKey === "processingFailed") {
    return t("workspaces.unlock.processingFailed");
  }

  if (errorKey === "unsupported") {
    return t("workspaces.unlock.invalidFile");
  }

  if (errorKey === "filesExpired") {
    return t("workspaces.unlock.expiredDescription", { hours });
  }

  return undefined;
}

function resolveWatermarkErrorMessage(
  errorKey: PublicToolErrorKey,
  t: ReturnType<typeof useTranslations>,
  hours: number,
): string | undefined {
  if (errorKey === "processingFailed") {
    return t("workspaces.watermark.processingFailed");
  }

  if (errorKey === "unsupported") {
    return t("workspaces.watermark.invalidFile");
  }

  if (errorKey === "filesExpired") {
    return t("workspaces.watermark.expiredDescription", { hours });
  }

  return undefined;
}

function resolveCropErrorMessage(
  errorKey: PublicToolErrorKey,
  t: ReturnType<typeof useTranslations>,
  hours: number,
): string | undefined {
  if (errorKey === "processingFailed") {
    return t("workspaces.crop.processingFailed");
  }

  if (errorKey === "unsupported") {
    return t("workspaces.crop.invalidFile");
  }

  if (errorKey === "filesExpired") {
    return t("workspaces.crop.expiredDescription", { hours });
  }

  return undefined;
}

function resolveSignErrorMessage(
  errorKey: PublicToolErrorKey,
  t: ReturnType<typeof useTranslations>,
  hours: number,
): string | undefined {
  if (errorKey === "processingFailed") {
    return t("workspaces.sign.processingFailed");
  }

  if (errorKey === "unsupported") {
    return t("workspaces.sign.invalidFile");
  }

  if (errorKey === "filesExpired") {
    return t("workspaces.sign.expiredDescription", { hours });
  }

  return undefined;
}

function resolveFillErrorMessage(
  errorKey: PublicToolErrorKey,
  t: ReturnType<typeof useTranslations>,
  hours: number,
): string | undefined {
  if (errorKey === "processingFailed") {
    return t("workspaces.fill.processingFailed");
  }

  if (errorKey === "unsupported") {
    return t("workspaces.fill.invalidFile");
  }

  if (errorKey === "filesExpired") {
    return t("workspaces.fill.expiredDescription", { hours });
  }

  return undefined;
}

function resolveEditErrorMessage(
  errorKey: PublicToolErrorKey,
  t: ReturnType<typeof useTranslations>,
  hours: number,
): string | undefined {
  if (errorKey === "processingFailed") {
    return t("workspaces.edit.processingFailed");
  }

  if (errorKey === "unsupported") {
    return t("workspaces.edit.invalidFile");
  }

  if (errorKey === "filesExpired") {
    return t("workspaces.edit.expiredDescription", { hours });
  }

  return undefined;
}
