"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { isConversionExpired } from "@/features/conversions/lib/can-download-conversion";
import { conversionListRefetchInterval } from "@/features/conversions/lib/conversion-polling";
import { mapUnknownUploadError } from "@/features/files/api/file-errors";
import { startBrowserDownload } from "@/features/files/lib/start-browser-download";
import { createPublicToolApis } from "@/features/public-tools/api/public-tool-api";
import { publicToolQueryKeys } from "@/features/public-tools/api/public-tool-query-keys";
import { mapRecentExecution } from "@/features/public-tools/lib/map-recent-execution";
import {
  isExpirationResponse,
  isMissingResourceResponse,
} from "@/features/public-tools/lib/public-tool-errors";
import {
  RECENT_EXECUTIONS_LIMIT,
  RECENT_EXECUTIONS_STALE_TIME_MS,
} from "@/features/public-tools/lib/recent-executions";
import { resolvePublicToolAuthState } from "@/features/public-tools/lib/resolve-public-tool-auth-state";
import type { RecentExecution } from "@/features/public-tools/types/recent-execution";
import { authClient } from "@/lib/auth/auth-client";

export function useRecentExecutions(_options?: { authenticated?: boolean }) {
  const tErrors = useTranslations("files.errors");
  const session = authClient.useSession();
  const { isAuthenticated, authPending } = resolvePublicToolAuthState({
    sessionPending: session.isPending,
    hasSessionUser: session.data?.user !== undefined,
  });
  const apis = useMemo(
    () => createPublicToolApis(isAuthenticated),
    [isAuthenticated],
  );
  const [now, setNow] = useState(() => new Date());
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const query = useQuery({
    queryKey: publicToolQueryKeys.recent(isAuthenticated),
    queryFn: () =>
      apis.listConversions({
        limit: RECENT_EXECUTIONS_LIMIT,
      }),
    enabled: !authPending,
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
      toast.error(tErrors(mapUnknownUploadError(error)));
    } finally {
      setDownloadingId(null);
    }
  }

  return {
    executions: conversions
      .filter((conversion) => !isConversionExpired(conversion, now))
      .map((conversion) => mapRecentExecution(conversion, now)),
    isPending: authPending || query.isPending,
    isError: query.isError,
    isAuthenticated,
    downloadingId,
    now,
    refetch: query.refetch,
    download,
  };
}
