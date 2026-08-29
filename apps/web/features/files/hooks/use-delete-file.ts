"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteFile } from "@/features/files/api/file-api";
import { mapUnknownUploadError } from "@/features/files/api/file-errors";
import { filesQueryKeys } from "@/features/files/api/file-query-keys";

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
