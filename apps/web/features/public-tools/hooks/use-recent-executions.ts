"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { conversionListRefetchInterval } from "@/features/conversions/lib/conversion-polling";
import { startBrowserDownload } from "@/features/files/lib/start-browser-download";
import { authClient } from "@/lib/auth/auth-client";
import { createPublicToolApis } from "../api/public-tool-api";
import { publicToolQueryKeys } from "../api/public-tool-query-keys";
import { mapRecentExecution } from "../lib/map-recent-execution";
import {
  isExpirationResponse,
  isMissingResourceResponse,
} from "../lib/public-tool-errors";
import {
  RECENT_EXECUTIONS_LIMIT,
  RECENT_EXECUTIONS_STALE_TIME_MS,
} from "../lib/recent-executions";
import type { RecentExecution } from "../types/recent-execution";

export function useRecentExecutions() {
  const session = authClient.useSession();
  const isAuthenticated = session.data !== null && session.data !== undefined;
  const apis = useMemo(
    () => createPublicToolApis(isAuthenticated),
    [isAuthenticated],
  );
  const [now, setNow] = useState(() => new Date());
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: publicToolQueryKeys.recent(isAuthenticated),
    queryFn: () =>
      apis.listConversions({
        limit: RECENT_EXECUTIONS_LIMIT,
      }),
    enabled: !session.isPending,
    staleTime: RECENT_EXECUTIONS_STALE_TIME_MS,
    refetchInterval: (result) =>
      conversionListRefetchInterval(
        result.state.data?.conversions.map((conversion) => conversion.status) ??
          [],
      ),
  });

  const conversions = query.data?.conversions ?? [];

  useEffect(() => {
    const nextExpiry = conversions
      .map((conversion) => conversion.expiresAt)
      .filter((expiresAt): expiresAt is string => expiresAt !== null)
      .map((expiresAt) => new Date(expiresAt).getTime())
      .filter((expiresAt) => expiresAt > Date.now())
      .sort((left, right) => left - right)[0];

    if (nextExpiry === undefined) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setNow(new Date());
    }, nextExpiry - Date.now());

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [conversions]);

  async function download(execution: RecentExecution): Promise<void> {
    if (!execution.canDownload || execution.outputFileId === null) {
      return;
    }

    setDownloadingId(execution.id);

    try {
      const result = await apis.createDownloadUrl(execution.outputFileId);
      startBrowserDownload(result.download.url);
    } catch (error) {
      if (isExpirationResponse(error) || isMissingResourceResponse(error)) {
        await query.refetch();
      }
    } finally {
      setDownloadingId(null);
    }
  }

  return {
    executions: conversions.map((conversion) =>
      mapRecentExecution(conversion, now),
    ),
    isPending: session.isPending || query.isPending,
    isError: query.isError,
    isAuthenticated,
    downloadingId,
    refetch: query.refetch,
    download,
  };
}
