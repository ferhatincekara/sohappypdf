"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiKeyListItem } from "@/features/api-keys/components/api-key-list-item";
import { apiKeyListView } from "@/features/api-keys/lib/api-key-list-view";
import type { PublicApiKey } from "@/features/api-keys/types/api-key";

export function ApiKeyList({
  apiKeys,
  isLoading,
  isError,
  errorMessage,
  onRevoke,
  onRetry,
}: {
  apiKeys: PublicApiKey[];
  isLoading: boolean;
  isError: boolean;
  errorMessage: string;
  onRevoke: (apiKey: PublicApiKey) => void;
  onRetry: () => void;
}) {
  const t = useTranslations("apiKeys.list");
  const view = apiKeyListView({
    isLoading,
    isError,
    itemCount: apiKeys.length,
  });

  if (view === "loading") {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <p className="sr-only">{t("loading")}</p>
        <ApiKeyListSkeleton />
      </div>
    );
  }

  if (view === "error") {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-destructive">{errorMessage}</p>
        <Button type="button" size="sm" variant="outline" onClick={onRetry}>
          {t("retry")}
        </Button>
      </div>
    );
  }

  if (view === "empty") {
    return (
      <div className="rounded-md bg-white px-5 py-8">
        <p className="text-lg font-extrabold tracking-tight">{t("empty")}</p>
        <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
          {t("emptyHint")}
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {apiKeys.map((apiKey) => (
        <ApiKeyListItem key={apiKey.id} apiKey={apiKey} onRevoke={onRevoke} />
      ))}
    </ul>
  );
}

const API_KEY_SKELETON_IDS = ["one", "two", "three"] as const;

function ApiKeyListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {API_KEY_SKELETON_IDS.map((row) => (
        <div
          key={row}
          className="flex flex-col gap-4 rounded-md bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
        >
          <div className="flex min-w-0 items-start gap-3">
            <Skeleton className="size-10 shrink-0 rounded-2xl" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <Skeleton className="mt-2 h-8 w-48 max-w-full rounded-xl" />
              <Skeleton className="mt-2 h-3 w-52 max-w-full" />
            </div>
          </div>
          <Skeleton className="h-7 w-16 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  );
}
