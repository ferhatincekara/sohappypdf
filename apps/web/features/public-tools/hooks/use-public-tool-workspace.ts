"use client";

import {
  resolveWebMaxFileSizeBytes,
  resolveWebMaxPagesPerFile,
} from "@repo/billing/plans";
import {
  isPremiumTool,
  type ToolDefinition,
  toolCombinesSourceFiles,
} from "@repo/tools/catalog";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { billingApi } from "@/features/billing/api/billing-api";
import { billingQueryKeys } from "@/features/billing/api/billing-query-keys";
import type { WebToolBilling } from "@/features/billing/lib/web-tool-billing";
import { conversionQueryKeys } from "@/features/conversions/api/conversion-query-keys";
import { canDownloadConversion } from "@/features/conversions/lib/can-download-conversion";
import type { PublicConversion } from "@/features/conversions/types/conversion";
import {
  bulkDownloadArchiveName,
  bulkDownloadEntryName,
} from "@/features/files/lib/bulk-download-name";
import { startBrowserDownload } from "@/features/files/lib/start-browser-download";
import {
  createFileUploadWorkflow,
  type FileUploadWorkflow,
} from "@/features/files/lib/upload-workflow";
import { authClient } from "@/lib/auth/auth-client";
import { createPublicToolApis } from "../api/public-tool-api";
import { publicToolQueryKeys } from "../api/public-tool-query-keys";
import {
  exceedsPlanPageLimit,
  shouldHoldPdfForPageLimit,
} from "../lib/plan-page-limit";
import {
  isExpirationResponse,
  isMissingResourceResponse,
  mapPublicToolError,
  mapUploadWorkflowErrorKey,
  type PublicToolErrorKey,
} from "../lib/public-tool-errors";
import { resolveToolUxState } from "../lib/resolve-tool-ux-state";
import { toolExecutionQueryRefetchInterval } from "../lib/tool-execution-polling";
import { maxFilesForTool } from "../lib/tool-limits";
import { toolAutoStartsWhenReady } from "../lib/tool-requires-configuration";
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
import { isFileWorkspaceUx } from "../types/tool-ux-state";

export function usePublicToolWorkspace(
  tool: ToolDefinition,
  options?: {
    authenticated?: boolean;
    billing?: WebToolBilling;
  },
) {
  const session = authClient.useSession();
  const queryClient = useQueryClient();
  const isAuthenticated =
    options?.authenticated === true || session.data?.user !== undefined;
  const authPending = session.isPending && options?.authenticated !== true;
  const apis = useMemo(
    () => createPublicToolApis(isAuthenticated),
    [isAuthenticated],
  );
  const billingQuery = useQuery({
    queryKey: billingQueryKeys.status(),
    queryFn: () => billingApi.getStatus(),
    enabled: isAuthenticated,
    staleTime: 0,
  });
  const billing = billingQuery.data?.billing;
  const maxFiles = maxFilesForTool(tool, {
    anonymous: !isAuthenticated,
    plan: billing?.plan ?? options?.billing?.plan,
    maxFilesPerOperation:
      billing?.limits.maxFilesPerOperation ??
      options?.billing?.maxFilesPerOperation,
  });
  const allowsMultiple = maxFiles > 1;
  const maxFileSizeBytes = resolveWebMaxFileSizeBytes({
    isAuthenticated,
    planMaxFileSizeBytes:
      billing?.limits.maxFileSizeBytes ?? options?.billing?.maxFileSizeBytes,
  });
  const maxPagesPerFile = resolveWebMaxPagesPerFile({
    isAuthenticated,
    planMaxPagesPerFile:
      billing?.limits.maxPagesPerFile ?? options?.billing?.maxPagesPerFile,
  });
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
  const [executionIds, setExecutionIds] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [resultExpired, setResultExpired] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const workflowsRef = useRef(new Map<string, FileUploadWorkflow>());
  const filesRef = useRef(files);
  const startUploadRef = useRef<(entry: WorkspaceFile) => void>(() => {});
  const autoStartLockRef = useRef(false);
  const inspectStartedRef = useRef(new Set<string>());
  const inspectEntryRef = useRef<(id: string) => void>(() => {});
  const onProcessRef = useRef<() => Promise<void>>(async () => {});
  filesRef.current = files;
  const autoProcess = toolAutoStartsWhenReady(tool.id);
  const needsSignIn = !tool.allowsAnonymous && !isAuthenticated && !authPending;
  const isBillingPending = isAuthenticated && billingQuery.isPending;
  const accessResolved = !authPending && !isBillingPending;
  const needsPro =
    isPremiumTool(tool) &&
    accessResolved &&
    billingQuery.data?.billing.plan !== "pro";

  const executionQueries = useQueries({
    queries: executionIds.map((id) => ({
      queryKey: publicToolQueryKeys.execution(id, isAuthenticated),
      queryFn: () => apis.getConversion(id),
      refetchInterval: (query: {
        state: { data: PublicConversion | undefined; error: unknown };
      }) =>
        toolExecutionQueryRefetchInterval({
          conversion: query.state.data,
          hasExecutionId: true,
          error: query.state.error,
        }),
      placeholderData: (previousData: PublicConversion | undefined) =>
        previousData,
      retry: (failureCount: number, error: unknown) => {
        if (isExpirationResponse(error) || isMissingResourceResponse(error)) {
          return false;
        }

        return failureCount < 2;
      },
    })),
  });
  const executions = executionQueries.flatMap((query) =>
    query.data === undefined ? [] : [query.data],
  );
  const execution = executions[0];
  const executionQueryError =
    executionQueries.find((query) => query.error !== null)?.error ?? null;
  const executionId = executionIds[0] ?? null;

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

  const pendingUploadCount = files.filter(
    (entry) => entry.status === "pending",
  ).length;
  const inspectingCount = files.filter(
    (entry) => entry.status === "inspecting",
  ).length;

  useEffect(() => {
    if (!canUploadNow || authPending || pendingUploadCount === 0) {
      return;
    }

    for (const entry of filesRef.current) {
      if (entry.status === "pending") {
        startUploadRef.current(entry);
      }
    }
  }, [authPending, canUploadNow, pendingUploadCount]);

  useEffect(() => {
    if (!accessResolved || inspectingCount === 0) {
      return;
    }

    for (const entry of filesRef.current) {
      if (entry.status === "inspecting") {
        inspectEntryRef.current(entry.id);
      }
    }
  }, [accessResolved, inspectingCount]);

  const hasActiveJob = executions.some(
    (job) =>
      job.status === "pending" ||
      job.status === "queued" ||
      job.status === "processing",
  );

  useEffect(() => {
    if (!isCreatingExecution && !hasActiveJob) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 5_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [hasActiveJob, isCreatingExecution]);

  useEffect(() => {
    if (files.length > maxFiles) {
      setSelectionError("tooManyFiles");
      return;
    }

    setSelectionError((current) =>
      current === "tooManyFiles" ? null : current,
    );
  }, [files.length, maxFiles]);

  const ux = resolveToolUxState({
    toolId: tool.id,
    files,
    isCreatingExecution,
    executionId,
    executionIds,
    execution,
    executions,
    executionQueryError,
    selectionError,
    processError,
    downloadError,
    resultExpired,
    now,
  });

  const isBusy =
    isCreatingExecution ||
    hasUploadingWorkspaceFiles(files) ||
    (executionIds.length > 0 && executions.length < executionIds.length) ||
    executions.some(
      (job) =>
        job.status === "pending" ||
        job.status === "queued" ||
        job.status === "processing",
    );

  const conversionOptions = buildToolConversionOptions(tool.id, workspaceState);
  const canProcess =
    isFileWorkspaceUx(ux) &&
    !isBusy &&
    !authPending &&
    !needsPro &&
    validateToolProcess({
      toolId: tool.id,
      allowsAnonymous: tool.allowsAnonymous,
      isAuthenticated,
      files,
      maxFiles,
      maxPagesPerFile,
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
    if (!canUploadNow || authPending) {
      return;
    }

    if (workflowsRef.current.has(entry.id)) {
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

  startUploadRef.current = startUpload;

  function releaseInspection(id: string) {
    inspectStartedRef.current.delete(id);
  }

  function continueUpload(id: string) {
    releaseInspection(id);
    queueMicrotask(() => {
      const next = filesRef.current.find((entry) => entry.id === id);
      if (next?.status === "pending") {
        startUpload(next);
      }
    });
  }

  function inspectEntry(id: string) {
    if (inspectStartedRef.current.has(id)) {
      return;
    }

    inspectStartedRef.current.add(id);

    const current = filesRef.current.find((entry) => entry.id === id);

    if (current === undefined || current.status !== "inspecting") {
      releaseInspection(id);
      return;
    }

    if (maxPagesPerFile === null) {
      setFiles((files) =>
        patchWorkspaceFile(files, id, {
          status: "pending",
        }),
      );
      continueUpload(id);
      return;
    }

    void (async () => {
      try {
        const { countPdfPages } = await import("../lib/pdfjs-client");
        const pageCount = await countPdfPages(current.file);
        const still = filesRef.current.find((entry) => entry.id === id);

        if (still === undefined || still.status !== "inspecting") {
          releaseInspection(id);
          return;
        }

        if (exceedsPlanPageLimit(pageCount, maxPagesPerFile)) {
          setFiles((files) =>
            patchWorkspaceFile(files, id, {
              status: "failed",
              pageCount,
              errorKey: "tooManyPages",
            }),
          );
          setSelectionError("tooManyPages");
          releaseInspection(id);
          return;
        }

        setFiles((files) =>
          patchWorkspaceFile(files, id, {
            status: "pending",
            pageCount,
          }),
        );
        continueUpload(id);
      } catch {
        const still = filesRef.current.find((entry) => entry.id === id);

        if (still === undefined || still.status !== "inspecting") {
          releaseInspection(id);
          return;
        }

        setFiles((files) =>
          patchWorkspaceFile(files, id, {
            status: "pending",
          }),
        );
        continueUpload(id);
      }
    })();
  }

  inspectEntryRef.current = inspectEntry;

  function addFiles(selected: FileList | File[]) {
    ingestFiles(selected, false);
  }

  function replaceFiles(selected: FileList | File[]) {
    ingestFiles(selected, true);
  }

  function ingestFiles(selected: FileList | File[], replace: boolean) {
    autoStartLockRef.current = false;
    setSelectionError(null);
    setProcessError(null);
    setDownloadError(null);
    setResultExpired(false);
    setExecutionIds([]);

    if (replace) {
      inspectStartedRef.current.clear();
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
    const createdIds = new Set(created.map((entry) => entry.id));

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

      return next.map((entry) => {
        if (entry.publicFile !== null || entry.status !== "pending") {
          return entry;
        }

        if (entry.file.size < 1) {
          return {
            ...entry,
            status: "failed" as const,
            errorKey: "emptyFile" as const,
          };
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

        if (
          shouldHoldPdfForPageLimit({
            file: entry.file,
            accessResolved,
            maxPagesPerFile,
          })
        ) {
          return {
            ...entry,
            status: "inspecting" as const,
          };
        }

        return entry;
      });
    });

    if (canUploadNow && !authPending) {
      queueMicrotask(() => {
        for (const entry of filesRef.current) {
          if (entry.status === "pending" && createdIds.has(entry.id)) {
            startUpload(entry);
          }
        }
      });
    }
  }

  function onRemove(id: string) {
    autoStartLockRef.current = false;
    inspectStartedRef.current.delete(id);
    stopWorkflow(id);
    setFiles((current) => removeWorkspaceFile(current, id));
    setSelectionError(null);
    setProcessError(null);
    setExecutionIds([]);
    setResultExpired(false);
  }

  function onRetryUpload(id: string) {
    const entry = files.find((file) => file.id === id);

    if (entry === undefined || entry.errorKey === "tooManyPages") {
      return;
    }

    setSelectionError(null);
    stopWorkflow(id);
    startUpload(entry);
  }

  function resetWorkspace() {
    autoStartLockRef.current = false;
    inspectStartedRef.current.clear();
    for (const id of workflowsRef.current.keys()) {
      stopWorkflow(id);
    }
    setFiles((current) => clearWorkspaceFiles(current));
    setWorkspaceState(DEFAULT_TOOL_WORKSPACE_STATE);
    setSelectionError(null);
    setProcessError(null);
    setDownloadError(null);
    setExecutionIds([]);
    setIsCreatingExecution(false);
    setIsDownloading(false);
    setResultExpired(false);
  }

  async function onProcess() {
    setSelectionError(null);
    setProcessError(null);
    setDownloadError(null);
    setResultExpired(false);
    setExecutionIds([]);

    if (authPending) {
      return;
    }

    const options = buildToolConversionOptions(tool.id, workspaceState);
    const validation = validateToolProcess({
      toolId: tool.id,
      allowsAnonymous: tool.allowsAnonymous,
      isAuthenticated,
      files,
      maxFiles,
      maxPagesPerFile,
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

      setSelectionError(validation.errorKey);
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
      const combines = toolCombinesSourceFiles(tool.id);
      const createdIds: string[] = [];

      if (combines || uploaded.length === 1) {
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
        queryClient.setQueryData(
          publicToolQueryKeys.execution(created.id, isAuthenticated),
          created,
        );
        createdIds.push(created.id);
      } else {
        for (const file of uploaded) {
          const created = await apis.createConversion({
            sourceFileId: file.id,
            type: tool.id,
            targetFormat,
            options,
          });
          queryClient.setQueryData(
            publicToolQueryKeys.execution(created.id, isAuthenticated),
            created,
          );
          createdIds.push(created.id);
        }
      }

      setProcessError(null);
      setExecutionIds(createdIds);
      void queryClient.invalidateQueries({
        queryKey: publicToolQueryKeys.recent(isAuthenticated),
      });
      if (isAuthenticated) {
        void queryClient.invalidateQueries({
          queryKey: conversionQueryKeys.lists(),
        });
        void queryClient.invalidateQueries({
          queryKey: billingQueryKeys.status(),
        });
      }
    } catch (error) {
      setProcessError(mapPublicToolError(error));
    } finally {
      setIsCreatingExecution(false);
    }
  }

  async function onDownload(outputFileId?: string) {
    if (ux.status !== "success") {
      return;
    }

    const fileIds =
      outputFileId === undefined
        ? ux.outputs.map((output) => output.outputFileId)
        : [outputFileId];

    if (fileIds.length === 0 || fileIds.some((fileId) => fileId === "")) {
      setResultExpired(true);
      setDownloadError(null);
      return;
    }

    const downloadable = fileIds.every((fileId) => {
      const job =
        executions.find((item) => item.outputFileId === fileId) ?? execution;

      return job !== undefined && canDownloadConversion(job, now);
    });

    if (!downloadable) {
      setResultExpired(true);
      setDownloadError(null);
      return;
    }

    setIsDownloading(true);
    setDownloadError(null);

    try {
      if (fileIds.length === 1) {
        const fileId = fileIds[0];

        if (fileId !== undefined) {
          const result = await apis.createDownloadUrl(fileId);
          const output = ux.outputs.find(
            (entry) => entry.outputFileId === fileId,
          );
          startBrowserDownload(
            result.download.url,
            bulkDownloadEntryName({
              sourceFilename: output?.sourceFilename ?? ux.sourceFilename,
              targetFormat: output?.targetFormat ?? ux.targetFormat,
              index: 0,
            }),
          );
        }
      } else {
        const files = fileIds.map((fileId, index) => {
          const output = ux.outputs.find(
            (entry) => entry.outputFileId === fileId,
          );

          return {
            id: fileId,
            name: bulkDownloadEntryName({
              sourceFilename: output?.sourceFilename ?? ux.sourceFilename,
              targetFormat: output?.targetFormat ?? ux.targetFormat,
              index,
            }),
          };
        });
        const archiveName = bulkDownloadArchiveName({
          toolId: tool.id,
          count: files.length,
        });
        const result = await apis.createArchiveDownloadUrl({
          files,
          archiveName,
        });
        startBrowserDownload(result.download.url, archiveName);
      }
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

  onProcessRef.current = onProcess;

  useEffect(() => {
    if (!autoProcess || !canProcess || autoStartLockRef.current) {
      return;
    }

    autoStartLockRef.current = true;
    void onProcessRef.current();
  }, [autoProcess, canProcess]);

  return {
    ux,
    files,
    workspaceState,
    setWorkspaceState,
    isAuthenticated,
    isBusy,
    canProcess,
    autoProcess,
    reorderable,
    maxFiles,
    allowsMultiple,
    maxFileSizeBytes,
    maxPagesPerFile,
    isDownloading,
    needsSignIn,
    needsPro,
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
