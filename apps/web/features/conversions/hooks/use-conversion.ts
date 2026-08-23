"use client";

import { useQuery } from "@tanstack/react-query";
import { conversionApi } from "../api/conversion-api";
import { mapUnknownConversionError } from "../api/conversion-errors";
import { conversionQueryKeys } from "../api/conversion-query-keys";
import { conversionRefetchInterval } from "../lib/conversion-polling";

export function useConversion(id: string, options?: { enabled?: boolean }) {
  const query = useQuery({
    queryKey: conversionQueryKeys.detail(id),
    queryFn: () => conversionApi.get(id),
    enabled: options?.enabled ?? id.length > 0,
    refetchInterval: (result) =>
      conversionRefetchInterval(result.state.data?.status),
  });

  return {
    conversion: query.data,
    isLoading: query.isPending,
    isError: query.isError,
    errorKey:
      query.error === null ? null : mapUnknownConversionError(query.error),
    refetch: query.refetch,
  };
}
