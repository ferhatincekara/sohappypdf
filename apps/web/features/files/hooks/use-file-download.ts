"use client";

import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createDownloadUrl } from "../api/file-api";
import { mapUnknownUploadError } from "../api/file-errors";
import { startBrowserDownload } from "../lib/start-browser-download";

export function useFileDownload() {
  const tErrors = useTranslations("files.errors");
  const mutation = useMutation({
    mutationFn: async (fileId: string) => {
      const result = await createDownloadUrl(fileId);
      startBrowserDownload(result.download.url);
    },
    onError: (error) => {
      toast.error(tErrors(mapUnknownUploadError(error)));
    },
  });

  return {
    downloadFile: mutation.mutate,
    isPending: mutation.isPending,
  };
}
