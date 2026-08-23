"use client";

import { useFormatter, useTranslations } from "next-intl";
import { FileConvertButton } from "@/features/conversions/components/file-convert-button";
import { formatFileSize } from "../lib/format-file-size";
import { isFileDownloadable } from "../lib/is-file-downloadable";
import {
  PUBLIC_FILE_STATUSES,
  type PublicFile,
  type PublicFileStatus,
} from "../types/file";
import { FileDownloadButton } from "./file-download-button";

export function FileList({
  files,
  isLoading,
  isError,
  errorMessage,
  onConvert,
}: {
  files: PublicFile[];
  isLoading: boolean;
  isError: boolean;
  errorMessage: string;
  onConvert: (file: PublicFile) => void;
}) {
  const t = useTranslations("files.list");

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t("loading")}</p>;
  }

  if (isError) {
    return <p className="text-sm text-destructive">{errorMessage}</p>;
  }

  if (files.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-card">
      {files.map((file) => (
        <FileListItem key={file.id} file={file} onConvert={onConvert} />
      ))}
    </ul>
  );
}

function FileListItem({
  file,
  onConvert,
}: {
  file: PublicFile;
  onConvert: (file: PublicFile) => void;
}) {
  const t = useTranslations("files.list");
  const formatter = useFormatter();
  const status = isPublicFileStatus(file.status) ? file.status : "pending";

  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {file.filename}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(file.size)}
          <span aria-hidden="true"> · </span>
          {formatter.dateTime(new Date(file.createdAt), {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <p className="text-xs font-medium text-muted-foreground">
          {t(`status.${status}`)}
        </p>
        {isFileDownloadable(file) ? (
          <FileDownloadButton fileId={file.id} variant="outline" />
        ) : null}
        <FileConvertButton file={file} onConvert={onConvert} />
      </div>
    </li>
  );
}

function isPublicFileStatus(value: string): value is PublicFileStatus {
  return PUBLIC_FILE_STATUSES.some((status) => status === value);
}
