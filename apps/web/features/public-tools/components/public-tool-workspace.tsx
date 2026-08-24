"use client";

import type { ToolDefinition } from "@repo/tools/catalog";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getPublicWebEnv } from "@/config/public-env";
import { loginPath, signupPath } from "@/features/auth/paths";
import { conversionRefetchInterval } from "@/features/conversions/lib/conversion-polling";
import {
  CONVERSION_TYPES,
  type ConversionType,
} from "@/features/conversions/types/conversion";
import { formatFileSize } from "@/features/files/lib/format-file-size";
import { startBrowserDownload } from "@/features/files/lib/start-browser-download";
import {
  createFileUploadWorkflow,
  type FileUploadWorkflow,
} from "@/features/files/lib/upload-workflow";
import { authClient } from "@/lib/auth/auth-client";
import { Link } from "@/lib/i18n/navigation";
import { createPublicToolApis } from "../api/public-tool-api";
import {
  PUBLIC_ANONYMOUS_MAX_FILE_SIZE_BYTES,
  PUBLIC_ANONYMOUS_RETENTION_HOURS,
} from "../lib/anonymous-limits";
import { formatAcceptedFormats } from "../lib/format-labels";
import { resolveToolProcessingPhase } from "../lib/processing-phase";
import {
  mapConversionFailure,
  mapPublicToolError,
  mapUploadWorkflowErrorKey,
  type PublicToolErrorKey,
} from "../lib/public-tool-errors";
import { acceptForTool, maxFilesForTool } from "../lib/tool-limits";
import {
  buildToolConversionOptions,
  DEFAULT_TOOL_WORKSPACE_STATE,
} from "../lib/tool-workspace";
import {
  appendWorkspaceFiles,
  areWorkspaceFilesReady,
  clearWorkspaceFiles,
  createWorkspaceFiles,
  hasUploadingWorkspaceFiles,
  moveWorkspaceFile,
  patchWorkspaceFile,
  removeWorkspaceFile,
  reorderWorkspaceFile,
  resolveToolFileContentType,
  supportsFileReorder,
  type WorkspaceFile,
} from "../lib/workspace-files";
import { ToolDropzone } from "./tool-dropzone";
import { ToolFileList } from "./tool-file-list";
import {
  ToolOptionsPanel,
  toolHasWorkspaceOptions,
} from "./tool-options-panel";
import { ToolProcessingStatus } from "./tool-processing-status";
import { ToolResult } from "./tool-result";

function isConversionType(value: string): value is ConversionType {
  return CONVERSION_TYPES.some((type) => type === value);
}

export function PublicToolWorkspace({ tool }: { tool: ToolDefinition }) {
  const t = useTranslations("publicTools");
  const session = authClient.useSession();
  const isAuthenticated = session.data !== null && session.data !== undefined;
  const apis = useMemo(
    () => createPublicToolApis(isAuthenticated),
    [isAuthenticated],
  );
  const maxFiles = maxFilesForTool(tool, !isAuthenticated);
  const maxFileSizeBytes = isAuthenticated
    ? getPublicWebEnv().maxUploadFileSizeBytes
    : PUBLIC_ANONYMOUS_MAX_FILE_SIZE_BYTES;
  const canUploadNow = tool.allowsAnonymous || isAuthenticated;
  const reorderable = supportsFileReorder(tool);

  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [workspaceState, setWorkspaceState] = useState(
    DEFAULT_TOOL_WORKSPACE_STATE,
  );
  const [errorKey, setErrorKey] = useState<PublicToolErrorKey | null>(null);
  const [isCreatingConversion, setIsCreatingConversion] = useState(false);
  const [conversionId, setConversionId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const workflowsRef = useRef(new Map<string, FileUploadWorkflow>());
  const errorRef = useRef<HTMLDivElement>(null);
  const filesRef = useRef(files);
  filesRef.current = files;

  const conversionQuery = useQuery({
    queryKey: ["public-tool-conversion", conversionId, isAuthenticated],
    queryFn: () => apis.getConversion(conversionId ?? ""),
    enabled: conversionId !== null,
    refetchInterval: (result) =>
      conversionRefetchInterval(result.state.data?.status),
  });

  const conversion = conversionQuery.data;

  useEffect(() => {
    if (conversion?.status === "failed") {
      setErrorKey(mapConversionFailure(conversion.error));
    }
  }, [conversion?.status, conversion?.error]);

  useEffect(() => {
    if (errorKey !== null) {
      errorRef.current?.focus();
    }
  }, [errorKey]);

  useEffect(() => {
    return () => {
      for (const workflow of workflowsRef.current.values()) {
        workflow.cancel();
        workflow.reset();
      }
      workflowsRef.current.clear();
      clearWorkspaceFiles(filesRef.current);
    };
  }, []);

  const formatsLabel = formatAcceptedFormats(
    tool.inputFormats,
    t("upload.conjunction"),
  );
  const maxSizeLabel = formatFileSize(maxFileSizeBytes);
  const hasOptions = toolHasWorkspaceOptions(tool.id);

  const processLabel =
    tool.id === "merge-pdf"
      ? t("merge")
      : tool.id === "split-pdf"
        ? t("split")
        : t("process");

  const phase = resolveToolProcessingPhase({
    hasError: errorKey !== null,
    isCreatingConversion,
    fileStatuses: files.map((entry) => entry.status),
    conversionStatus: conversion?.status,
  });

  const isBusy =
    isCreatingConversion ||
    hasUploadingWorkspaceFiles(files) ||
    conversion?.status === "pending" ||
    conversion?.status === "queued" ||
    conversion?.status === "processing";

  const canProcess =
    !isBusy &&
    files.length > 0 &&
    !session.isPending &&
    conversion?.status !== "completed";

  const showResult = conversion?.status === "completed";

  function stopWorkflow(id: string) {
    const workflow = workflowsRef.current.get(id);
    if (workflow === undefined) {
      return;
    }

    workflow.cancel();
    workflow.reset();
    workflowsRef.current.delete(id);
  }

  function startUpload(entry: WorkspaceFile) {
    if (!canUploadNow || session.isPending) {
      return;
    }

    const contentType = resolveToolFileContentType(
      entry.file,
      tool.inputFormats,
    );

    if (contentType === null) {
      setFiles((current) =>
        patchWorkspaceFile(current, entry.id, {
          status: "failed",
          errorKey: "unsupported",
        }),
      );
      return;
    }

    if (entry.file.size > maxFileSizeBytes) {
      setFiles((current) =>
        patchWorkspaceFile(current, entry.id, {
          status: "failed",
          errorKey: "tooLarge",
        }),
      );
      return;
    }

    stopWorkflow(entry.id);

    const workflow = createFileUploadWorkflow({
      createUpload: apis.createUpload,
      completeUpload: apis.completeUpload,
    });
    workflowsRef.current.set(entry.id, workflow);

    setFiles((current) =>
      patchWorkspaceFile(current, entry.id, {
        status: "uploading",
        errorKey: null,
        publicFile: null,
      }),
    );

    const unsubscribe = workflow.subscribe((state) => {
      if (state.status === "uploading" || state.status === "preparing") {
        setFiles((current) =>
          patchWorkspaceFile(current, entry.id, {
            status: "uploading",
            progress: state.progress,
          }),
        );
        return;
      }

      if (state.status === "finalizing") {
        setFiles((current) =>
          patchWorkspaceFile(current, entry.id, {
            status: "uploading",
            progress: state.progress,
          }),
        );
        return;
      }

      if (state.status === "completed" && state.publicFile !== null) {
        unsubscribe();
        setFiles((current) =>
          patchWorkspaceFile(current, entry.id, {
            status: "ready",
            publicFile: state.publicFile,
            progress: state.progress,
            errorKey: null,
          }),
        );
        return;
      }

      if (state.status === "failed") {
        unsubscribe();
        setFiles((current) =>
          patchWorkspaceFile(current, entry.id, {
            status: "failed",
            errorKey: mapUploadWorkflowErrorKey(state.errorKey),
          }),
        );
      }
    });

    workflow.start(entry.file, contentType);
  }

  function addFiles(selected: FileList | File[]) {
    setErrorKey(null);
    setConversionId(null);

    const created = createWorkspaceFiles(selected);

    setFiles((current) => {
      const { files: next, rejected } = appendWorkspaceFiles(
        current,
        created,
        maxFiles,
      );

      if (rejected !== null) {
        queueMicrotask(() => {
          setErrorKey("tooManyFiles");
        });
      }

      const validated = next.map((entry) => {
        if (entry.publicFile !== null || entry.status !== "pending") {
          return entry;
        }

        if (entry.file.size > maxFileSizeBytes) {
          return {
            ...entry,
            status: "failed" as const,
            errorKey: "tooLarge" as const,
          };
        }

        if (
          resolveToolFileContentType(entry.file, tool.inputFormats) === null
        ) {
          return {
            ...entry,
            status: "failed" as const,
            errorKey: "unsupported" as const,
          };
        }

        return entry;
      });

      const pendingUploads = validated.filter(
        (entry) => entry.status === "pending",
      );

      if (canUploadNow && !session.isPending && pendingUploads.length > 0) {
        queueMicrotask(() => {
          for (const entry of pendingUploads) {
            startUpload(entry);
          }
        });
      }

      return validated;
    });
  }

  function onRemove(id: string) {
    stopWorkflow(id);
    setFiles((current) => removeWorkspaceFile(current, id));
    setErrorKey(null);
    setConversionId(null);
  }

  function onRetry(id: string) {
    const entry = files.find((file) => file.id === id);
    if (entry === undefined) {
      return;
    }

    setErrorKey(null);
    startUpload(entry);
  }

  function resetWorkspace() {
    for (const id of workflowsRef.current.keys()) {
      stopWorkflow(id);
    }
    setFiles((current) => clearWorkspaceFiles(current));
    setWorkspaceState(DEFAULT_TOOL_WORKSPACE_STATE);
    setErrorKey(null);
    setConversionId(null);
    setIsCreatingConversion(false);
    setIsDownloading(false);
  }

  async function onProcess() {
    setErrorKey(null);
    setConversionId(null);

    if (session.isPending) {
      return;
    }

    if (!tool.allowsAnonymous && !isAuthenticated) {
      setErrorKey("signInRequired");
      return;
    }

    if (files.length === 0) {
      setErrorKey("noFile");
      return;
    }

    if (files.length > maxFiles) {
      setErrorKey("tooManyFiles");
      return;
    }

    if (tool.id === "merge-pdf" && files.length < 2) {
      setErrorKey("tooFewFiles");
      return;
    }

    if (!isConversionType(tool.id)) {
      setErrorKey("unsupported");
      return;
    }

    if (files.some((entry) => entry.status === "failed")) {
      setErrorKey("networkFailure");
      return;
    }

    if (!areWorkspaceFilesReady(files)) {
      if (hasUploadingWorkspaceFiles(files)) {
        setErrorKey(null);
        return;
      }

      if (!canUploadNow) {
        setErrorKey("signInRequired");
        return;
      }

      for (const entry of files) {
        if (entry.status === "pending") {
          startUpload(entry);
        }
      }
      return;
    }

    const selectedOutput =
      workspaceState.outputFormat.trim().length > 0
        ? workspaceState.outputFormat.trim()
        : undefined;
    const targetFormat =
      selectedOutput !== undefined &&
      tool.outputFormats.some((format) => format === selectedOutput)
        ? selectedOutput
        : tool.outputFormats[0];

    if (targetFormat === undefined) {
      setErrorKey("unsupported");
      return;
    }

    const options = buildToolConversionOptions(tool.id, workspaceState);

    if (
      tool.id !== "merge-pdf" &&
      tool.id !== "repair-pdf" &&
      options === undefined &&
      (tool.id === "organize-pdf" ||
        tool.id === "reorder-pages" ||
        tool.id === "remove-pages" ||
        tool.id === "watermark-pdf" ||
        tool.id === "protect-pdf" ||
        tool.id === "unlock-pdf" ||
        tool.id === "translate-pdf")
    ) {
      setErrorKey("invalidOptions");
      return;
    }

    const uploaded = files
      .map((entry) => entry.publicFile)
      .filter((file): file is NonNullable<typeof file> => file !== null);
    const source = uploaded[0];

    if (source === undefined) {
      setErrorKey("noFile");
      return;
    }

    setIsCreatingConversion(true);

    try {
      const created = await apis.createConversion({
        sourceFileId: source.id,
        type: tool.id,
        targetFormat,
        additionalFileIds:
          uploaded.length < 2
            ? undefined
            : uploaded.slice(1).map((file) => file.id),
        options,
      });

      setConversionId(created.id);
    } catch (error) {
      setErrorKey(mapPublicToolError(error));
    } finally {
      setIsCreatingConversion(false);
    }
  }

  async function onDownload() {
    const outputFileId = conversion?.outputFileId;

    if (outputFileId === null || outputFileId === undefined) {
      return;
    }

    setIsDownloading(true);
    setErrorKey(null);

    try {
      const result = await apis.createDownloadUrl(outputFileId);
      startBrowserDownload(result.download.url);
    } catch (error) {
      setErrorKey(mapPublicToolError(error));
    } finally {
      setIsDownloading(false);
    }
  }

  if (session.isPending) {
    return (
      <div className="rounded-lg border border-border bg-card p-8">
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-28 md:pb-0">
      {!showResult ? (
        <>
          <ToolDropzone
            accept={acceptForTool(tool)}
            multiple={maxFiles > 1}
            disabled={isBusy}
            formatsLabel={formatsLabel}
            maxSizeLabel={maxSizeLabel}
            onSelectFiles={addFiles}
          />

          <ToolFileList
            files={files}
            reorderable={reorderable}
            disabled={isBusy}
            onMove={(index, direction) => {
              setFiles((current) =>
                moveWorkspaceFile(current, index, direction),
              );
            }}
            onReorder={(from, to) => {
              setFiles((current) => reorderWorkspaceFile(current, from, to));
            }}
            onRemove={onRemove}
            onRetry={onRetry}
          />

          {hasOptions ? (
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
                  state={workspaceState}
                  onChange={setWorkspaceState}
                  disabled={
                    isCreatingConversion || conversion?.status === "completed"
                  }
                />
              </div>
            </section>
          ) : null}

          <ToolProcessingStatus phase={phase} />
        </>
      ) : (
        <ToolResult
          targetFormat={conversion.targetFormat}
          sourceFilename={conversion.sourceFilename}
          signupHref={signupPath(tool.route)}
          isAuthenticated={isAuthenticated}
          isDownloading={isDownloading}
          onDownload={() => {
            void onDownload();
          }}
          onReset={resetWorkspace}
        />
      )}

      {errorKey !== null ? (
        <div ref={errorRef} tabIndex={-1} className="outline-none">
          <Alert variant="destructive">
            <AlertTitle>{t("errors.title")}</AlertTitle>
            <AlertDescription>
              <p>{t(`errors.${errorKey}`)}</p>
              {errorKey === "signInRequired" ? (
                <p className="mt-2">
                  <Link
                    href={loginPath(tool.route)}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {t("errors.signInCta")}
                  </Link>
                </p>
              ) : null}
            </AlertDescription>
          </Alert>
        </div>
      ) : null}

      {!showResult ? (
        <div className="hidden md:block">
          <Button
            type="button"
            size="lg"
            disabled={!canProcess}
            onClick={() => {
              void onProcess();
            }}
          >
            {isCreatingConversion ? t("processing") : processLabel}
          </Button>
        </div>
      ) : null}

      {!showResult ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
          <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-muted-foreground">
                {t("limits", {
                  files: maxFiles,
                  sizeMb: Math.floor(maxFileSizeBytes / (1024 * 1024)),
                  hours: PUBLIC_ANONYMOUS_RETENTION_HOURS,
                })}
              </p>
            </div>
            <Button
              type="button"
              size="lg"
              className="shrink-0"
              disabled={!canProcess}
              onClick={() => {
                void onProcess();
              }}
            >
              {isCreatingConversion ? t("processing") : processLabel}
            </Button>
          </div>
        </div>
      ) : (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
          <div className="mx-auto flex w-full max-w-3xl gap-2">
            <Button
              type="button"
              size="lg"
              className="flex-1"
              disabled={isDownloading}
              onClick={() => {
                void onDownload();
              }}
            >
              {isDownloading ? t("result.downloading") : t("download")}
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="flex-1"
              onClick={resetWorkspace}
            >
              {t("result.processAnother")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
