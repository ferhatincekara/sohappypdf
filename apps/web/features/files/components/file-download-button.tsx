"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useFileDownload } from "../hooks/use-file-download";

export function FileDownloadButton({
  fileId,
  variant = "default",
}: {
  fileId: string;
  variant?: "default" | "outline";
}) {
  const t = useTranslations("files.actions");
  const tErrors = useTranslations("files.errors");
  const { downloadFile, isPending, errorKey } = useFileDownload();

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        size="sm"
        variant={variant}
        disabled={isPending}
        onClick={() => downloadFile(fileId)}
      >
        {isPending ? t("downloading") : t("download")}
      </Button>
      {errorKey === null ? null : (
        <p className="text-xs text-destructive">{tErrors(errorKey)}</p>
      )}
    </div>
  );
}
