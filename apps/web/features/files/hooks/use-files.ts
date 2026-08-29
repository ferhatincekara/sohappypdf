"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { listFiles } from "@/features/files/api/file-api";
import { mapUnknownUploadError } from "@/features/files/api/file-errors";
import { filesQueryKeys } from "@/features/files/api/file-query-keys";
import { parseFileListSearchParams } from "@/features/files/lib/file-list-params";

export function useFiles() {
  const searchParams = useSearchParams();
  const params = parseFileListSearchParams(searchParams);
  const query = useQuery({
    queryKey: filesQueryKeys.list(params),
    queryFn: ({ signal }) => listFiles(params, { signal }),
  });

  return {
    files: query.data?.files ?? [],
    nextCursor: query.data?.nextCursor ?? null,
    params,
    isLoading: query.isPending,
    isError: query.isError,
    errorKey: query.error === null ? null : mapUnknownUploadError(query.error),
    refetch: query.refetch,
  };
}
