"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { FileConvertButton } from "@/features/conversions/components/file-convert-button";
import { formatFileSize } from "../lib/format-file-size";
import { isFileDeletable } from "../lib/is-file-deletable";
import { isFileDownloadable } from "../lib/is-file-downloadable";
import { formatFromPublicFile } from "../lib/supported-upload-types";
import {
  PUBLIC_FILE_STATUSES,
  type PublicFile,
  type PublicFileStatus,
} from "../types/file";
import { FileDownloadButton } from "./file-download-button";

export function FileListItem({
  file,
  onConvert,
  onDelete,
}: {
  file: PublicFile;
  onConvert: (file: PublicFile) => void;
  onDelete: (file: PublicFile) => void;
}) {
  const t = useTranslations("files.list");
  const tFormats = useTranslations("files.formats");
  const tActions = useTranslations("files.actions");
  const formatter = useFormatter();
  const status = isPublicFileStatus(file.status) ? file.status : "pending";
  const format = formatFromPublicFile(file);

  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {file.filename}
        </p>
        <p className="text-xs text-muted-foreground">
          {format === undefined ? t("unknownType") : tFormats(format)}
          <span aria-hidden="true"> · </span>
          {formatFileSize(file.size)}
          <span aria-hidden="true"> · </span>
          {t(`status.${status}`)}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("created", {
            date: formatter.dateTime(new Date(file.createdAt), {
              dateStyle: "medium",
              timeStyle: "short",
            }),
          })}
          <span aria-hidden="true"> · </span>
          {t("expires", {
            date: formatter.dateTime(new Date(file.expiresAt), {
              dateStyle: "medium",
              timeStyle: "short",
            }),
          })}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {isFileDownloadable(file) ? (
          <FileDownloadButton fileId={file.id} variant="outline" />
        ) : null}
        <FileConvertButton file={file} onConvert={onConvert} />
        {isFileDeletable(file) ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-label={tActions("deleteNamed", { filename: file.filename })}
            onClick={() => onDelete(file)}
          >
            {tActions("delete")}
          </Button>
        ) : null}
      </div>
    </li>
  );
}

function isPublicFileStatus(value: string): value is PublicFileStatus {
  return PUBLIC_FILE_STATUSES.some((status) => status === value);
}
