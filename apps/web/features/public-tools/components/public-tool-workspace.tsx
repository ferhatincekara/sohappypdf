"use client";

import type { ToolDefinition } from "@repo/tools/catalog";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPublicWebEnv } from "@/config/public-env";
import { signupPath } from "@/features/auth/paths";
import {
  CONVERSION_ERROR_KEYS,
  mapUnknownConversionError,
  toConversionClientError,
} from "@/features/conversions/api/conversion-errors";
import { conversionRefetchInterval } from "@/features/conversions/lib/conversion-polling";
import {
  CONVERSION_TYPES,
  type ConversionType,
} from "@/features/conversions/types/conversion";
import {
  FILE_ERROR_KEYS,
  mapUnknownUploadError,
  toFileClientError,
} from "@/features/files/api/file-errors";
import { startBrowserDownload } from "@/features/files/lib/start-browser-download";
import { createFileUploadWorkflow } from "@/features/files/lib/upload-workflow";
import type { PublicFile } from "@/features/files/types/file";
import { authClient } from "@/lib/auth/auth-client";
import { Link } from "@/lib/i18n/navigation";
import { createPublicToolApis } from "../api/public-tool-api";
import {
  PUBLIC_ANONYMOUS_MAX_FILE_SIZE_BYTES,
  PUBLIC_ANONYMOUS_RETENTION_HOURS,
} from "../lib/anonymous-limits";
import { acceptForTool, maxFilesForTool } from "../lib/tool-limits";
import {
  buildToolConversionOptions,
  DEFAULT_TOOL_WORKSPACE_STATE,
  type ToolWorkspaceState,
} from "../lib/tool-workspace";

type SelectedFile = {
  id: string;
  file: File;
};

function createSelectedFiles(selected: FileList | null): SelectedFile[] {
  if (selected === null) {
    return [];
  }

  return Array.from(selected).map((file) => ({
    id: crypto.randomUUID(),
    file,
  }));
}

type PublicToolErrorKey =
  | "noFile"
  | "tooFewFiles"
  | "tooManyFiles"
  | "tooLarge"
  | "unsupported"
  | "invalidOptions"
  | "rateLimited"
  | "networkFailure"
  | "creditsExhausted"
  | "signInRequired"
  | "processingFailed"
  | "unexpected";

function mapUploadErrorKey(errorKey: string): PublicToolErrorKey | undefined {
  switch (errorKey) {
    case FILE_ERROR_KEYS.fileTooLarge:
      return "tooLarge";
    case FILE_ERROR_KEYS.unsupportedType:
      return "unsupported";
    case FILE_ERROR_KEYS.rateLimited:
      return "rateLimited";
    case FILE_ERROR_KEYS.unauthorized:
      return "signInRequired";
    case FILE_ERROR_KEYS.networkFailure:
    case FILE_ERROR_KEYS.expiredUpload:
    case FILE_ERROR_KEYS.objectNotUploaded:
      return "networkFailure";
    default:
      return undefined;
  }
}

function mapConversionErrorKey(
  errorKey: string,
): PublicToolErrorKey | undefined {
  switch (errorKey) {
    case CONVERSION_ERROR_KEYS.rateLimited:
      return "rateLimited";
    case CONVERSION_ERROR_KEYS.networkFailure:
      return "networkFailure";
    case CONVERSION_ERROR_KEYS.unsupportedConversion:
    case CONVERSION_ERROR_KEYS.invalidTargetFormat:
    case CONVERSION_ERROR_KEYS.typeRequired:
      return "invalidOptions";
    case CONVERSION_ERROR_KEYS.planLimitReached:
      return "creditsExhausted";
    case CONVERSION_ERROR_KEYS.unauthorized:
      return "signInRequired";
    case CONVERSION_ERROR_KEYS.sourceUnavailable:
    case CONVERSION_ERROR_KEYS.conflict:
      return "networkFailure";
    default:
      return undefined;
  }
}

function mapPublicToolError(error: unknown): PublicToolErrorKey {
  const fileClient = toFileClientError(error);
  if (fileClient.code === "INTERNAL_ERROR") {
    return "networkFailure";
  }
  if (fileClient.code === "FORBIDDEN") {
    return "signInRequired";
  }
  if (fileClient.code === "PLAN_LIMIT_REACHED") {
    return "creditsExhausted";
  }

  const conversionClient = toConversionClientError(error);
  if (conversionClient.code === "INTERNAL_ERROR") {
    return "networkFailure";
  }
  if (conversionClient.code === "FORBIDDEN") {
    return "signInRequired";
  }
  if (conversionClient.code === "PLAN_LIMIT_REACHED") {
    return "creditsExhausted";
  }

  if (error instanceof Error) {
    const uploadFromMessage = mapUploadErrorKey(error.message);
    if (uploadFromMessage !== undefined) {
      return uploadFromMessage;
    }
  }

  const uploadError = mapUploadErrorKey(mapUnknownUploadError(error));
  if (uploadError !== undefined) {
    return uploadError;
  }

  const conversionError = mapConversionErrorKey(
    mapUnknownConversionError(error),
  );
  if (conversionError !== undefined) {
    return conversionError;
  }

  if (toFileClientError(error).kind === "network") {
    return "networkFailure";
  }

  return "unexpected";
}

function isConversionType(value: string): value is ConversionType {
  return CONVERSION_TYPES.some((type) => type === value);
}

function contentTypeForFile(file: File): string | null {
  if (file.type.length > 0) {
    return file.type;
  }

  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    return "application/pdf";
  }

  return null;
}

async function uploadSelectedFile(
  createUpload: ReturnType<typeof createPublicToolApis>["createUpload"],
  completeUpload: ReturnType<typeof createPublicToolApis>["completeUpload"],
  file: File,
  contentType: string,
): Promise<PublicFile> {
  const workflow = createFileUploadWorkflow({
    createUpload,
    completeUpload,
  });

  return await new Promise((resolve, reject) => {
    const unsubscribe = workflow.subscribe((state) => {
      if (state.status === "completed" && state.publicFile !== null) {
        unsubscribe();
        resolve(state.publicFile);
        return;
      }

      if (state.status === "failed") {
        unsubscribe();
        reject(new Error(state.errorKey ?? FILE_ERROR_KEYS.unexpected));
      }
    });

    workflow.start(file, contentType);
  });
}

function ToolOptionsPanel({
  tool,
  state,
  onChange,
}: {
  tool: ToolDefinition;
  state: ToolWorkspaceState;
  onChange: (next: ToolWorkspaceState) => void;
}) {
  const t = useTranslations("publicTools.options");

  switch (tool.id) {
    case "compress-pdf":
      return (
        <div className="flex flex-col gap-2">
          <Label htmlFor="compression-level">{t("compressionLevel")}</Label>
          <select
            id="compression-level"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={state.compressionLevel}
            onChange={(event) => {
              onChange({
                ...state,
                compressionLevel: event.target
                  .value as ToolWorkspaceState["compressionLevel"],
              });
            }}
          >
            <option value="low">{t("compressionLow")}</option>
            <option value="medium">{t("compressionMedium")}</option>
            <option value="high">{t("compressionHigh")}</option>
          </select>
        </div>
      );
    case "rotate-pdf":
      return (
        <div className="flex flex-col gap-2">
          <Label htmlFor="rotation">{t("rotation")}</Label>
          <select
            id="rotation"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={state.rotationDegrees}
            onChange={(event) => {
              onChange({
                ...state,
                rotationDegrees: Number(
                  event.target.value,
                ) as ToolWorkspaceState["rotationDegrees"],
              });
            }}
          >
            <option value={90}>90°</option>
            <option value={180}>180°</option>
            <option value={270}>270°</option>
          </select>
        </div>
      );
    case "split-pdf":
      return (
        <div className="flex flex-col gap-2">
          <Label htmlFor="split-ranges">{t("splitRanges")}</Label>
          <Input
            id="split-ranges"
            placeholder={t("splitRangesPlaceholder")}
            value={state.splitRanges}
            onChange={(event) => {
              onChange({ ...state, splitRanges: event.target.value });
            }}
          />
        </div>
      );
    case "organize-pdf":
    case "reorder-pages":
      return (
        <div className="flex flex-col gap-2">
          <Label htmlFor="page-order">{t("pageOrder")}</Label>
          <Input
            id="page-order"
            placeholder={t("pageOrderPlaceholder")}
            value={state.pageOrder}
            onChange={(event) => {
              onChange({ ...state, pageOrder: event.target.value });
            }}
          />
        </div>
      );
    case "remove-pages":
      return (
        <div className="flex flex-col gap-2">
          <Label htmlFor="remove-pages">{t("pagesToRemove")}</Label>
          <Input
            id="remove-pages"
            placeholder={t("pagesToRemovePlaceholder")}
            value={state.pagesToRemove}
            onChange={(event) => {
              onChange({ ...state, pagesToRemove: event.target.value });
            }}
          />
        </div>
      );
    case "crop-pdf":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {(["top", "right", "bottom", "left"] as const).map((side) => (
            <div key={side} className="flex flex-col gap-2">
              <Label htmlFor={`crop-${side}`}>
                {t(
                  side === "top"
                    ? "cropTop"
                    : side === "right"
                      ? "cropRight"
                      : side === "bottom"
                        ? "cropBottom"
                        : "cropLeft",
                )}
              </Label>
              <Input
                id={`crop-${side}`}
                type="number"
                min={0}
                value={state.cropMargins[side]}
                onChange={(event) => {
                  onChange({
                    ...state,
                    cropMargins: {
                      ...state.cropMargins,
                      [side]: Number(event.target.value),
                    },
                  });
                }}
              />
            </div>
          ))}
        </div>
      );
    case "watermark-pdf":
      return (
        <div className="flex flex-col gap-2">
          <Label htmlFor="watermark">{t("watermarkText")}</Label>
          <Input
            id="watermark"
            value={state.watermarkText}
            onChange={(event) => {
              onChange({ ...state, watermarkText: event.target.value });
            }}
          />
        </div>
      );
    case "page-numbers-pdf":
      return (
        <div className="flex flex-col gap-2">
          <Label htmlFor="page-start">{t("pageNumberStart")}</Label>
          <Input
            id="page-start"
            type="number"
            min={1}
            value={state.pageNumberStart}
            onChange={(event) => {
              onChange({
                ...state,
                pageNumberStart: Number(event.target.value),
              });
            }}
          />
        </div>
      );
    case "protect-pdf":
    case "unlock-pdf":
      return (
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">{t("password")}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={state.password}
            onChange={(event) => {
              onChange({ ...state, password: event.target.value });
            }}
          />
        </div>
      );
    case "ai-summarizer":
      return (
        <div className="flex flex-col gap-2">
          <Label htmlFor="output-format">{t("outputFormat")}</Label>
          <select
            id="output-format"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={state.outputFormat === "" ? "txt" : state.outputFormat}
            onChange={(event) => {
              onChange({ ...state, outputFormat: event.target.value });
            }}
          >
            <option value="txt">TXT</option>
            <option value="md">Markdown</option>
          </select>
        </div>
      );
    case "translate-pdf":
      return (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="target-language">{t("targetLanguage")}</Label>
            <select
              id="target-language"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={state.targetLanguage}
              onChange={(event) => {
                onChange({ ...state, targetLanguage: event.target.value });
              }}
            >
              <option value="eng">English</option>
              <option value="tur">Turkish</option>
              <option value="deu">German</option>
              <option value="fra">French</option>
              <option value="spa">Spanish</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="translate-output-format">{t("outputFormat")}</Label>
            <select
              id="translate-output-format"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={state.outputFormat === "" ? "pdf" : state.outputFormat}
              onChange={(event) => {
                onChange({ ...state, outputFormat: event.target.value });
              }}
            >
              <option value="pdf">PDF</option>
              <option value="txt">TXT</option>
            </select>
          </div>
        </div>
      );
    default:
      return null;
  }
}

export function PublicToolWorkspace({ tool }: { tool: ToolDefinition }) {
  const t = useTranslations("publicTools");
  const tTools = useTranslations("tools");
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
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [workspaceState, setWorkspaceState] = useState(
    DEFAULT_TOOL_WORKSPACE_STATE,
  );
  const [errorKey, setErrorKey] = useState<PublicToolErrorKey | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversionId, setConversionId] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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
      setErrorKey("processingFailed");
    }
  }, [conversion?.status]);

  const title = tTools(`${tool.id}.name`);
  const processLabel =
    tool.id === "merge-pdf"
      ? t("merge")
      : tool.id === "split-pdf"
        ? t("split")
        : t("process");

  function moveFile(index: number, direction: -1 | 1) {
    setFiles((current) => {
      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const currentFile = next[index];
      const swapFile = next[nextIndex];

      if (currentFile === undefined || swapFile === undefined) {
        return current;
      }

      next[index] = swapFile;
      next[nextIndex] = currentFile;
      return next;
    });
  }

  async function onProcess() {
    setErrorKey(null);
    setDownloaded(false);
    setConversionId(null);

    if (session.isPending) {
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

    if (files.some((entry) => entry.file.size > maxFileSizeBytes)) {
      setErrorKey("tooLarge");
      return;
    }

    if (!isConversionType(tool.id)) {
      setErrorKey("unsupported");
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

    if (tool.id === "merge-pdf" && files.length < 2) {
      setErrorKey("tooFewFiles");
      return;
    }

    setIsProcessing(true);

    try {
      const uploaded: PublicFile[] = [];

      for (const entry of files) {
        const file = entry.file;
        const contentType = contentTypeForFile(file);

        if (contentType === null) {
          setErrorKey("unsupported");
          setIsProcessing(false);
          return;
        }

        uploaded.push(
          await uploadSelectedFile(
            apis.createUpload,
            apis.completeUpload,
            file,
            contentType,
          ),
        );
      }

      const source = uploaded[0];

      if (source === undefined) {
        setErrorKey("noFile");
        setIsProcessing(false);
        return;
      }

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
      setIsProcessing(false);
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
      setDownloaded(true);
    } catch (error) {
      setErrorKey(mapPublicToolError(error));
    } finally {
      setIsDownloading(false);
    }
  }

  const canDownload =
    conversion?.status === "completed" && conversion.outputFileId !== null;

  if (session.isPending) {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-16">
        <p className="text-muted-foreground">{t("loading")}</p>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">
          {tool.allowsAnonymous
            ? t("description")
            : t("descriptionAuthenticated")}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("limits", {
            files: maxFiles,
            sizeMb: Math.floor(maxFileSizeBytes / (1024 * 1024)),
            hours: PUBLIC_ANONYMOUS_RETENTION_HOURS,
          })}
        </p>
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium">
        {maxFiles > 1 ? t("selectFiles") : t("selectFile")}
        <input
          type="file"
          accept={acceptForTool(tool)}
          multiple={maxFiles > 1}
          onChange={(event) => {
            const selected = event.target.files;
            setFiles(createSelectedFiles(selected));
            setErrorKey(null);
            setConversionId(null);
            setDownloaded(false);
          }}
        />
      </label>

      {files.length > 0 ? (
        <ul className="flex flex-col gap-2 text-sm">
          {files.map((entry, index) => (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
            >
              <span className="truncate text-muted-foreground">
                {entry.file.name}
              </span>
              {tool.id === "merge-pdf" ? (
                <span className="flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={index === 0}
                    onClick={() => moveFile(index, -1)}
                  >
                    {t("moveUp")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={index === files.length - 1}
                    onClick={() => moveFile(index, 1)}
                  >
                    {t("moveDown")}
                  </Button>
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <ToolOptionsPanel
        tool={tool}
        state={workspaceState}
        onChange={setWorkspaceState}
      />

      {errorKey !== null ? (
        <p className="text-sm text-destructive">{t(`errors.${errorKey}`)}</p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={() => void onProcess()}
          disabled={isProcessing || files.length === 0}
        >
          {isProcessing ? t("processing") : processLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => void onDownload()}
          disabled={!canDownload || isDownloading}
        >
          {t("download")}
        </Button>
      </div>

      {conversion !== undefined ? (
        <p className="text-sm text-muted-foreground">
          {t("status", { status: conversion.status })}
        </p>
      ) : null}

      {downloaded && !isAuthenticated ? (
        <p className="text-sm">
          {t("keepWorkspace")}{" "}
          <Link href={signupPath(tool.route)} className="underline">
            {t("createAccount")}
          </Link>
        </p>
      ) : null}
    </section>
  );
}
