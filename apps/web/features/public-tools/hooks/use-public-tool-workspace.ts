"use client";

import type { ToolDefinition } from "@repo/tools/catalog";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { getPublicWebEnv } from "@/config/public-env";
import { conversionQueryKeys } from "@/features/conversions/api/conversion-query-keys";
import { canDownloadConversion } from "@/features/conversions/lib/can-download-conversion";
import { startBrowserDownload } from "@/features/files/lib/start-browser-download";
import {
  createFileUploadWorkflow,
  type FileUploadWorkflow,
} from "@/features/files/lib/upload-workflow";
import { authClient } from "@/lib/auth/auth-client";
import { createPublicToolApis } from "../api/public-tool-api";
import { publicToolQueryKeys } from "../api/public-tool-query-keys";
import { PUBLIC_ANONYMOUS_MAX_FILE_SIZE_BYTES } from "../lib/anonymous-limits";
import {
  isExpirationResponse,
  isMissingResourceResponse,
  mapPublicToolError,
  mapUploadWorkflowErrorKey,
  type PublicToolErrorKey,
} from "../lib/public-tool-errors";
import { resolveToolUxState } from "../lib/resolve-tool-ux-state";
import { maxFilesForTool } from "../lib/tool-limits";
import {
  additionalFileIdsFromOptions,
  buildToolConversionOptions,
  DEFAULT_TOOL_WORKSPACE_STATE,
} from "../lib/tool-workspace";
import {
  isToolConversionType,
  validateToolProcess,
} from "../lib/validate-tool-process";
import {
  appendWorkspaceFiles,
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
import { useToolExecutionStatus } from "./use-tool-execution-status";

export function usePublicToolWorkspace(tool: ToolDefinition) {
  const session = authClient.useSession();
  const queryClient = useQueryClient();
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
  const [selectionError, setSelectionError] =
    useState<PublicToolErrorKey | null>(null);
  const [processError, setProcessError] = useState<PublicToolErrorKey | null>(
    null,
  );
  const [downloadError, setDownloadError] = useState<PublicToolErrorKey | null>(
    null,
  );
  const [isCreatingExecution, setIsCreatingExecution] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [resultExpired, setResultExpired] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const workflowsRef = useRef(new Map<string, FileUploadWorkflow>());
  const filesRef = useRef(files);
  filesRef.current = files;

  const executionQuery = useToolExecutionStatus({
    executionId,
    authenticated: isAuthenticated,
    getExecution: apis.getConversion,
  });

  const execution = executionQuery.data;

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

  useEffect(() => {
    if (execution?.expiresAt === undefined || execution.expiresAt === null) {
      return;
    }

    const remaining = new Date(execution.expiresAt).getTime() - Date.now();

    if (remaining <= 0) {
      setNow(new Date());
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setNow(new Date());
    }, remaining);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [execution?.expiresAt]);

  const ux = resolveToolUxState({
    files,
    isCreatingExecution,
    executionId,
    execution,
    executionQueryError: executionQuery.error,
    selectionError,
    processError,
    downloadError,
    resultExpired,
    now,
  });

  const isBusy =
    isCreatingExecution ||
    hasUploadingWorkspaceFiles(files) ||
    execution?.status === "pending" ||
    execution?.status === "queued" ||
    execution?.status === "processing";

  const conversionOptions = buildToolConversionOptions(tool.id, workspaceState);
  const canProcess =
    ux.status === "selected" &&
    !isBusy &&
    !session.isPending &&
    validateToolProcess({
      toolId: tool.id,
      allowsAnonymous: tool.allowsAnonymous,
      isAuthenticated,
      files,
      maxFiles,
      options: conversionOptions,
    }).ok;

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
    ingestFiles(selected, false);
  }

  function replaceFiles(selected: FileList | File[]) {
    ingestFiles(selected, true);
  }

  function ingestFiles(selected: FileList | File[], replace: boolean) {
    setSelectionError(null);
    setProcessError(null);
    setDownloadError(null);
    setResultExpired(false);
    setExecutionId(null);

    if (replace) {
      for (const id of workflowsRef.current.keys()) {
        stopWorkflow(id);
      }
      setWorkspaceState((current) => ({
        ...current,
        splitRanges: "",
        pageOrder: "",
        pageRotations: "",
        pageSelection: "",
        pagesToRemove: "",
      }));
    }

    const created = createWorkspaceFiles(selected);

    setFiles((current) => {
      const base = replace ? clearWorkspaceFiles(current) : current;
      const { files: next, rejected } = appendWorkspaceFiles(
        base,
        created,
        maxFiles,
      );

      if (rejected !== null) {
        queueMicrotask(() => {
          setSelectionError("tooManyFiles");
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
    setSelectionError(null);
    setProcessError(null);
    setExecutionId(null);
    setResultExpired(false);
  }

  function onRetryUpload(id: string) {
    const entry = files.find((file) => file.id === id);

    if (entry === undefined) {
      return;
    }

    setSelectionError(null);
    startUpload(entry);
  }

  function resetWorkspace() {
    for (const id of workflowsRef.current.keys()) {
      stopWorkflow(id);
    }
    setFiles((current) => clearWorkspaceFiles(current));
    setWorkspaceState(DEFAULT_TOOL_WORKSPACE_STATE);
    setSelectionError(null);
    setProcessError(null);
    setDownloadError(null);
    setExecutionId(null);
    setIsCreatingExecution(false);
    setIsDownloading(false);
    setResultExpired(false);
  }

  async function onProcess() {
    setSelectionError(null);
    setProcessError(null);
    setDownloadError(null);
    setResultExpired(false);
    setExecutionId(null);

    if (session.isPending) {
      return;
    }

    const options = buildToolConversionOptions(tool.id, workspaceState);
    const validation = validateToolProcess({
      toolId: tool.id,
      allowsAnonymous: tool.allowsAnonymous,
      isAuthenticated,
      files,
      maxFiles,
      options,
    });

    if (!validation.ok) {
      if ("reason" in validation) {
        if (validation.reason === "uploading") {
          return;
        }

        if (!canUploadNow) {
          setSelectionError("signInRequired");
          return;
        }

        for (const entry of files) {
          if (entry.status === "pending") {
            startUpload(entry);
          }
        }
        return;
      }

      if (
        validation.errorKey === "signInRequired" ||
        validation.errorKey === "noFile" ||
        validation.errorKey === "tooFewFiles" ||
        validation.errorKey === "tooManyFiles" ||
        validation.errorKey === "invalidOptions" ||
        validation.errorKey === "unsupported" ||
        validation.errorKey === "networkFailure"
      ) {
        setSelectionError(validation.errorKey);
        return;
      }

      setProcessError(validation.errorKey);
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
      setSelectionError("unsupported");
      return;
    }

    const uploaded = files
      .map((entry) => entry.publicFile)
      .filter((file): file is NonNullable<typeof file> => file !== null);
    const source = uploaded[0];

    if (source === undefined) {
      setSelectionError("noFile");
      return;
    }

    if (!isToolConversionType(tool.id)) {
      setSelectionError("unsupported");
      return;
    }

    setIsCreatingExecution(true);

    try {
      const optionFileIds = additionalFileIdsFromOptions(options);
      const created = await apis.createConversion({
        sourceFileId: source.id,
        type: tool.id,
        targetFormat,
        additionalFileIds:
          optionFileIds ??
          (uploaded.length < 2
            ? undefined
            : uploaded.slice(1).map((file) => file.id)),
        options,
      });

      setProcessError(null);
      setExecutionId(created.id);
      void queryClient.invalidateQueries({
        queryKey: publicToolQueryKeys.recent(isAuthenticated),
      });
      if (isAuthenticated) {
        void queryClient.invalidateQueries({
          queryKey: conversionQueryKeys.lists(),
        });
      }
    } catch (error) {
      setProcessError(mapPublicToolError(error));
    } finally {
      setIsCreatingExecution(false);
    }
  }

  async function onDownload() {
    if (ux.status !== "success") {
      return;
    }

    if (
      execution === undefined ||
      !canDownloadConversion(execution, now) ||
      execution.outputFileId === null
    ) {
      setResultExpired(true);
      setDownloadError(null);
      return;
    }

    setIsDownloading(true);
    setDownloadError(null);

    try {
      const result = await apis.createDownloadUrl(execution.outputFileId);
      startBrowserDownload(result.download.url);
    } catch (error) {
      if (isExpirationResponse(error) || isMissingResourceResponse(error)) {
        setResultExpired(true);
        return;
      }

      setDownloadError(mapPublicToolError(error));
    } finally {
      setIsDownloading(false);
    }
  }

  async function onRetry() {
    if (ux.status !== "error" || !ux.error.retryable) {
      return;
    }

    await onProcess();
  }

  return {
    ux,
    files,
    workspaceState,
    setWorkspaceState,
    isAuthenticated,
    isSessionPending: session.isPending,
    isBusy,
    canProcess,
    reorderable,
    maxFiles,
    maxFileSizeBytes,
    isDownloading,
    addFiles,
    replaceFiles,
    onRemove,
    onRetryUpload,
    onMove: (index: number, direction: -1 | 1) => {
      setFiles((current) => moveWorkspaceFile(current, index, direction));
    },
    onReorder: (from: number, to: number) => {
      setFiles((current) => reorderWorkspaceFile(current, from, to));
    },
    onProcess,
    onDownload,
    onRetry,
    resetWorkspace,
  };
}
