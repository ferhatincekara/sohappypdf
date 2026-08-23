"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteFile } from "../api/file-api";
import { mapUnknownUploadError } from "../api/file-errors";
import { filesQueryKeys } from "../api/file-query-keys";

export function useDeleteFile() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (fileId: string) => deleteFile(fileId),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: filesQueryKeys.lists() });
    },
  });

  return {
    deleteFile: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    errorKey:
      mutation.error === null ? null : mapUnknownUploadError(mutation.error),
    reset: mutation.reset,
  };
}
