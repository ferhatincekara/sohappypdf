"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { conversionApi } from "../api/conversion-api";
import { mapUnknownConversionError } from "../api/conversion-errors";
import { conversionQueryKeys } from "../api/conversion-query-keys";
import { isConversionExpired } from "../lib/can-download-conversion";
import { parseConversionListSearchParams } from "../lib/conversion-list-params";
import { conversionListRefetchInterval } from "../lib/conversion-polling";

export function useConversions() {
  const searchParams = useSearchParams();
  const params = parseConversionListSearchParams(searchParams);
  const query = useQuery({
    queryKey: conversionQueryKeys.list({
      cursor: params.cursor,
      status: params.status,
    }),
    queryFn: () =>
      conversionApi.list({
        cursor: params.cursor,
        status: params.status,
      }),
    refetchInterval: (result) =>
      conversionListRefetchInterval(
        result.state.data?.conversions.map((conversion) => conversion.status) ??
          [],
      ),
  });

  return {
    conversions: (query.data?.conversions ?? []).filter(
      (conversion) => !isConversionExpired(conversion),
    ),
    nextCursor: query.data?.nextCursor ?? null,
    params,
    isLoading: query.isPending,
    isError: query.isError,
    errorKey:
      query.error === null ? null : mapUnknownConversionError(query.error),
    refetch: query.refetch,
  };
}
