"use client";

import { useFormatter, useTranslations } from "next-intl";
import { formatFileSize } from "../lib/format-file-size";
import {
  PUBLIC_FILE_STATUSES,
  type PublicFile,
  type PublicFileStatus,
} from "../types/file";

export function FileList({
  files,
  isLoading,
  isError,
  errorMessage,
}: {
  files: PublicFile[];
  isLoading: boolean;
  isError: boolean;
  errorMessage: string;
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
        <FileListItem key={file.id} file={file} />
      ))}
    </ul>
  );
}

function FileListItem({ file }: { file: PublicFile }) {
  const t = useTranslations("files.list");
  const formatter = useFormatter();
  const status = isPublicFileStatus(file.status) ? file.status : "pending";

  return (
    <li className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
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
      <p className="text-xs font-medium text-muted-foreground">
        {t(`status.${status}`)}
      </p>
    </li>
  );
}

function isPublicFileStatus(value: string): value is PublicFileStatus {
  return PUBLIC_FILE_STATUSES.some((status) => status === value);
}
