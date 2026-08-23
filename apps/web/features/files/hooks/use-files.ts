"use client";

import { useQuery } from "@tanstack/react-query";
import { listFiles } from "../api/file-api";
import { mapUnknownUploadError } from "../api/file-errors";
import { filesQueryKeys } from "../api/file-query-keys";

export function useFiles() {
  const query = useQuery({
    queryKey: filesQueryKeys.list(),
    queryFn: listFiles,
  });

  return {
    files: query.data?.files ?? [],
    isLoading: query.isPending,
    isError: query.isError,
    errorKey: query.error === null ? null : mapUnknownUploadError(query.error),
    refetch: query.refetch,
  };
}
