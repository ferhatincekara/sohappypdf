"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConversionCreateDialog } from "@/features/conversions/components/conversion-create-dialog";
import { FileDeleteDialog } from "@/features/files/components/file-delete-dialog";
import { FileList } from "@/features/files/components/file-list";
import { FileUploadPanel } from "@/features/files/components/file-upload-panel";
import { useDeleteFile } from "@/features/files/hooks/use-delete-file";
import { useFiles } from "@/features/files/hooks/use-files";
import type { PublicFile } from "@/features/files/types/file";

export function FilesWorkspace() {
  const t = useTranslations("files.list");
  const tErrors = useTranslations("files.errors");
  const tDelete = useTranslations("files.delete");
  const { files, nextCursor, params, isLoading, isError, errorKey, refetch } =
    useFiles();
  const {
    deleteFile,
    isPending,
    errorKey: deleteErrorKey,
    reset,
  } = useDeleteFile();
  const [fileToConvert, setFileToConvert] = useState<PublicFile | null>(null);
  const [fileToDelete, setFileToDelete] = useState<PublicFile | null>(null);
  const [deleteSucceeded, setDeleteSucceeded] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      <FileUploadPanel onConvert={setFileToConvert} />
      <section
        className="flex flex-col gap-4"
        aria-labelledby="uploaded-files-heading"
      >
        <div className="flex flex-col gap-1">
          <h2
            id="uploaded-files-heading"
            className="text-sm font-medium text-foreground"
          >
            {t("title")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <div aria-live="polite" className="sr-only">
          {deleteSucceeded ? tDelete("success") : ""}
        </div>
        {deleteSucceeded ? (
          <p className="text-sm text-foreground">{tDelete("success")}</p>
        ) : null}
        <FileList
          files={files}
          cursor={params.cursor}
          nextCursor={nextCursor}
          isLoading={isLoading}
          isError={isError}
          errorMessage={
            errorKey === null ? tErrors("unexpected") : tErrors(errorKey)
          }
          onConvert={setFileToConvert}
          onDelete={(file) => {
            reset();
            setDeleteSucceeded(false);
            setFileToDelete(file);
          }}
          onRetry={() => {
            void refetch();
          }}
        />
      </section>
      <ConversionCreateDialog
        file={fileToConvert}
        onClose={() => setFileToConvert(null)}
      />
      <FileDeleteDialog
        file={fileToDelete}
        isPending={isPending}
        errorMessage={deleteErrorKey === null ? null : tErrors(deleteErrorKey)}
        onOpenChange={(open) => {
          if (!open) {
            setFileToDelete(null);
            reset();
          }
        }}
        onConfirm={() => {
          if (fileToDelete === null) {
            return;
          }

          void deleteFile(fileToDelete.id).then(() => {
            setFileToDelete(null);
            setDeleteSucceeded(true);
          });
        }}
      />
    </div>
  );
}
