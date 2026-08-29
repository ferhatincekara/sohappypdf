"use client";

import { DEFAULT_PLAN_LIMITS } from "@sohappypdf/billing/plans";
import { useTranslations } from "next-intl";
import { useBillingStatus } from "@/features/billing";
import { BillingUpgradeLink } from "@/features/billing/components/billing-upgrade-link";
import { FileUploadDropzone } from "@/features/files/components/file-upload-dropzone";
import { FileUploadError } from "@/features/files/components/file-upload-error";
import { FileUploadItem } from "@/features/files/components/file-upload-item";
import { useFileUpload } from "@/features/files/hooks/use-file-upload";
import { formatFileSize } from "@/features/files/lib/format-file-size";
import type { PublicFile } from "@/features/files/types/file";

export function FileUploadPanel({
  onConvert,
}: {
  onConvert?: (file: PublicFile) => void;
}) {
  const t = useTranslations("files.upload");
  const tErrors = useTranslations("files.errors");
  const tStatus = useTranslations("files.status");
  const { billing } = useBillingStatus();
  const maxUploadFileSizeBytes =
    billing?.limits.maxFileSizeBytes ??
    DEFAULT_PLAN_LIMITS.free.maxFileSizeBytes;
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
