"use client";

import { useQuery } from "@tanstack/react-query";
import type { PublicConversion } from "@/features/conversions/types/conversion";
import { publicToolQueryKeys } from "../api/public-tool-query-keys";
import {
  isExpirationResponse,
  isMissingResourceResponse,
} from "../lib/public-tool-errors";
import { toolExecutionRefetchInterval } from "../lib/tool-execution-polling";

export function useToolExecutionStatus(options: {
  executionId: string | null;
  authenticated: boolean;
  getExecution: (id: string) => Promise<PublicConversion>;
}) {
  const executionId = options.executionId;

  return useQuery({
    queryKey: publicToolQueryKeys.execution(
      executionId ?? "",
      options.authenticated,
    ),
    queryFn: () => {
      if (executionId === null) {
        throw new Error("Missing execution id");
      }

      return options.getExecution(executionId);
    },
    enabled: executionId !== null,
    refetchInterval: (query) => toolExecutionRefetchInterval(query.state.data),
    retry: (failureCount, error) => {
      if (isExpirationResponse(error) || isMissingResourceResponse(error)) {
        return false;
      }

      return failureCount < 2;
    },
  });
}
