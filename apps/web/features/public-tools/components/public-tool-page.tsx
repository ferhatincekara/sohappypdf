"use client";

import type { ToolDefinition } from "@repo/tools/catalog";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { getPublicWebEnv } from "@/config/public-env";
import { signupPath } from "@/features/auth/paths";
import { mapUnknownConversionError } from "@/features/conversions/api/conversion-errors";
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

type PublicToolErrorKey =
  | "noFile"
  | "tooManyFiles"
  | "tooLarge"
  | "unsupported"
  | "rateLimited"
  | "networkFailure"
  | "unexpected";

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

  if (name.endsWith(".png")) {
    return "image/png";
  }

  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  return null;
}

function mapPublicToolError(error: unknown): PublicToolErrorKey {
  if (error instanceof Error) {
    switch (error.message) {
      case FILE_ERROR_KEYS.fileTooLarge:
        return "tooLarge";
      case FILE_ERROR_KEYS.unsupportedType:
        return "unsupported";
      case FILE_ERROR_KEYS.rateLimited:
        return "rateLimited";
      case FILE_ERROR_KEYS.networkFailure:
      case FILE_ERROR_KEYS.expiredUpload:
        return "networkFailure";
      default:
        break;
    }
  }

  const uploadError = mapUnknownUploadError(error);
  if (uploadError === FILE_ERROR_KEYS.fileTooLarge) {
    return "tooLarge";
  }
  if (uploadError === FILE_ERROR_KEYS.unsupportedType) {
    return "unsupported";
  }
  if (uploadError === FILE_ERROR_KEYS.rateLimited) {
    return "rateLimited";
  }
  if (
    uploadError === FILE_ERROR_KEYS.networkFailure ||
    uploadError === FILE_ERROR_KEYS.expiredUpload
  ) {
    return "networkFailure";
  }

  const conversionError = mapUnknownConversionError(error);
  if (conversionError === "rateLimited") {
    return "rateLimited";
  }
  if (conversionError === "networkFailure") {
    return "networkFailure";
  }

  if (toFileClientError(error).kind === "network") {
    return "networkFailure";
  }

  return "unexpected";
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
        reject(new Error(state.errorKey ?? "failed"));
      }
    });

    workflow.start(file, contentType);
  });
}

export function PublicToolPageContent({ tool }: { tool: ToolDefinition }) {
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
  const [files, setFiles] = useState<File[]>([]);
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
  const title = tTools(`${tool.id}.name`);

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

    if (files.some((file) => file.size > maxFileSizeBytes)) {
      setErrorKey("tooLarge");
      return;
    }

    if (!isConversionType(tool.id)) {
      setErrorKey("unsupported");
      return;
    }

    const targetFormat = tool.outputFormats[0];

    if (targetFormat === undefined) {
      setErrorKey("unsupported");
      return;
    }

    setIsProcessing(true);

    try {
      const uploaded: PublicFile[] = [];

      for (const file of files) {
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
        <p className="text-muted-foreground">{t("description")}</p>
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
            setFiles(selected === null ? [] : Array.from(selected));
            setErrorKey(null);
            setConversionId(null);
            setDownloaded(false);
          }}
        />
      </label>

      {files.length > 0 ? (
        <ul className="text-sm text-muted-foreground">
          {files.map((file) => (
            <li key={`${file.name}-${file.size}`}>{file.name}</li>
          ))}
        </ul>
      ) : null}

      {errorKey !== null ? (
        <p className="text-sm text-destructive">{t(`errors.${errorKey}`)}</p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={() => void onProcess()}
          disabled={isProcessing || files.length === 0}
        >
          {isProcessing ? t("processing") : t("process")}
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
