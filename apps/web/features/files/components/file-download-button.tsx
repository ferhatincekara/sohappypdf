"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useFileDownload } from "../hooks/use-file-download";

export function FileDownloadButton({
  fileId,
  variant = "default",
}: {
  fileId: string;
  variant?: "default" | "outline" | "white";
}) {
  const t = useTranslations("files.actions");
  const { downloadFile, isPending } = useFileDownload();

  return (
    <Button
      type="button"
      size="sm"
      variant={variant}
      disabled={isPending}
      onClick={() => downloadFile(fileId)}
    >
      {isPending ? t("downloading") : t("download")}
    </Button>
  );
}
