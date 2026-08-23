"use client";

import { useMutation } from "@tanstack/react-query";
import { createDownloadUrl } from "../api/file-api";
import { mapUnknownUploadError } from "../api/file-errors";
import { startBrowserDownload } from "../lib/start-browser-download";

export function useFileDownload() {
  const mutation = useMutation({
    mutationFn: async (fileId: string) => {
      const result = await createDownloadUrl(fileId);
      startBrowserDownload(result.download.url);
    },
  });

  return {
    downloadFile: mutation.mutate,
    isPending: mutation.isPending,
    errorKey:
      mutation.error === null ? null : mapUnknownUploadError(mutation.error),
    reset: mutation.reset,
  };
}
