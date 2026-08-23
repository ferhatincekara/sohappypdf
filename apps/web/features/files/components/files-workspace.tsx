"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConversionCreateDialog } from "@/features/conversions/components/conversion-create-dialog";
import { useFiles } from "../hooks/use-files";
import type { PublicFile } from "../types/file";
import { FileList } from "./file-list";
import { FileUploadPanel } from "./file-upload-panel";

export function FilesWorkspace() {
  const t = useTranslations("files.list");
  const tErrors = useTranslations("files.errors");
  const { files, isLoading, isError, errorKey } = useFiles();
  const [fileToConvert, setFileToConvert] = useState<PublicFile | null>(null);

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
        <FileList
          files={files}
          isLoading={isLoading}
          isError={isError}
          errorMessage={
            errorKey === null ? tErrors("unexpected") : tErrors(errorKey)
          }
          onConvert={setFileToConvert}
        />
      </section>
      <ConversionCreateDialog
        file={fileToConvert}
        onClose={() => setFileToConvert(null)}
      />
    </div>
  );
}
