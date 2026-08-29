"use client";

import { useQuery } from "@tanstack/react-query";
import { conversionApi } from "@/features/conversions/api/conversion-api";
import { mapUnknownConversionError } from "@/features/conversions/api/conversion-errors";
import { conversionQueryKeys } from "@/features/conversions/api/conversion-query-keys";
import { conversionRefetchInterval } from "@/features/conversions/lib/conversion-polling";

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
