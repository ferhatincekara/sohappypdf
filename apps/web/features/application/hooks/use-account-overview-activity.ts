"use client";

import { useQuery } from "@tanstack/react-query";
import { conversionApi } from "@/features/conversions/api/conversion-api";
import { mapUnknownConversionError } from "@/features/conversions/api/conversion-errors";
import { conversionQueryKeys } from "@/features/conversions/api/conversion-query-keys";

const RECENT_ACTIVITY_LIMIT = 5;

export function useAccountOverviewActivity() {
  const query = useQuery({
    queryKey: conversionQueryKeys.list({ limit: RECENT_ACTIVITY_LIMIT }),
    queryFn: () => conversionApi.list({ limit: RECENT_ACTIVITY_LIMIT }),
  });

  return {
    conversions: query.data?.conversions ?? [],
    isLoading: query.isPending,
    isError: query.isError,
    errorKey:
      query.error === null ? null : mapUnknownConversionError(query.error),
  };
}
