"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileListItem } from "@/features/files/components/file-list-item";
import { fileListHref } from "@/features/files/lib/file-list-params";
import { fileListView } from "@/features/files/lib/file-list-view";
import type { PublicFile } from "@/features/files/types/file";
import { Link } from "@/lib/i18n/navigation";

export function FileList({
  files,
  cursor,
  nextCursor,
  isLoading,
  isError,
  errorMessage,
  onConvert,
  onDelete,
  onRetry,
}: {
  files: PublicFile[];
  cursor?: string;
  nextCursor: string | null;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string;
  onConvert: (file: PublicFile) => void;
  onDelete: (file: PublicFile) => void;
  onRetry: () => void;
}) {
  const t = useTranslations("files.list");
  const view = fileListView({
    isLoading,
    isError,
    itemCount: files.length,
  });

  if (view === "loading") {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <p className="sr-only">{t("loading")}</p>
        <FileListSkeleton />
      </div>
    );
  }

  if (view === "error") {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-destructive">{errorMessage}</p>
        <Button type="button" size="sm" variant="outline" onClick={onRetry}>
          {t("retry")}
        </Button>
      </div>
    );
  }

  if (view === "empty") {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border px-4 py-8">
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
        <p className="text-sm text-muted-foreground">{t("emptyHint")}</p>
        <a
          href="#file-upload"
          className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          {t("uploadCta")}
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {files.map((file) => (
          <FileListItem
            key={file.id}
            file={file}
            onConvert={onConvert}
            onDelete={onDelete}
          />
        ))}
      </ul>
      {cursor === undefined && nextCursor === null ? null : (
        <div className="flex flex-wrap items-center gap-3">
          {cursor === undefined ? null : (
            <Link
              href={fileListHref({})}
              className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              {t("firstPage")}
            </Link>
          )}
          {nextCursor === null ? null : (
            <Link
              href={fileListHref({ cursor: nextCursor })}
              className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              {t("nextPage")}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function FileListSkeleton() {
  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-card">
      {["one", "two", "three"].map((row) => (
        <div key={row} className="flex flex-col gap-2 px-4 py-3">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-64" />
        </div>
      ))}
    </div>
  );
}
