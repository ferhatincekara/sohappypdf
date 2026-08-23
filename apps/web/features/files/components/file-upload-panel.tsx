"use client";

import { useTranslations } from "next-intl";
import { getPublicWebEnv } from "@/config/public-env";
import { useBillingStatus } from "@/features/billing";
import { BillingUpgradeLink } from "@/features/billing/components/billing-upgrade-link";
import { useFileUpload } from "../hooks/use-file-upload";
import { formatFileSize } from "../lib/format-file-size";
import type { PublicFile } from "../types/file";
import { FileUploadDropzone } from "./file-upload-dropzone";
import { FileUploadError } from "./file-upload-error";
import { FileUploadItem } from "./file-upload-item";

export function FileUploadPanel({
  onConvert,
}: {
  onConvert?: (file: PublicFile) => void;
}) {
  const t = useTranslations("files.upload");
  const tErrors = useTranslations("files.errors");
  const tStatus = useTranslations("files.status");
  const publicMaxUploadFileSizeBytes = getPublicWebEnv().maxUploadFileSizeBytes;
  const { billing } = useBillingStatus();
  const maxUploadFileSizeBytes =
    billing?.limits.maxFileSizeBytes ?? publicMaxUploadFileSizeBytes;
  const {
    state,
    isBusy,
    canRetry,
    canCancel,
    selectFiles,
    openPicker,
    cancel,
    retry,
    reset,
  } = useFileUpload(maxUploadFileSizeBytes);

  const errorMessage =
    state.errorKey === null
      ? null
      : tErrors(state.errorKey, {
          maxSize: formatFileSize(maxUploadFileSizeBytes),
        });

  return (
    <section
      id="file-upload"
      className="flex flex-col gap-4"
      aria-labelledby="file-upload-heading"
    >
      <div className="flex flex-col gap-1">
        <h2
          id="file-upload-heading"
          className="text-sm font-medium text-foreground"
        >
          {t("title")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <div aria-live="polite" className="sr-only">
        {tStatus(state.status)}
        {errorMessage ?? ""}
      </div>

      {state.selectedFile === null ? (
        <FileUploadDropzone
          disabled={isBusy}
          onOpenPicker={openPicker}
          onSelectFiles={selectFiles}
        />
      ) : (
        <FileUploadItem
          state={state}
          canCancel={canCancel}
          canRetry={canRetry}
          onCancel={cancel}
          onRetry={retry}
          onReset={reset}
          onConvert={onConvert}
        />
      )}

      <FileUploadError
        message={errorMessage}
        upgradeLink={
          state.errorKey === "fileTooLarge" ||
          state.errorKey === "storageLimitReached" ? (
            <BillingUpgradeLink />
          ) : null
        }
      />
    </section>
  );
}
