"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiKeyListView } from "../lib/api-key-list-view";
import type { PublicApiKey } from "../types/api-key";
import { ApiKeyListItem } from "./api-key-list-item";

export function ApiKeyList({
  apiKeys,
  isLoading,
  isError,
  errorMessage,
  onCreate,
  onRevoke,
  onRetry,
}: {
  apiKeys: PublicApiKey[];
  isLoading: boolean;
  isError: boolean;
  errorMessage: string;
  onCreate: () => void;
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
      <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border px-4 py-8">
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
        <p className="text-sm text-muted-foreground">{t("emptyHint")}</p>
        <Button type="button" size="sm" onClick={onCreate}>
          {t("createCta")}
        </Button>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-card">
      {apiKeys.map((apiKey) => (
        <ApiKeyListItem key={apiKey.id} apiKey={apiKey} onRevoke={onRevoke} />
      ))}
    </ul>
  );
}

function ApiKeyListSkeleton() {
  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-card">
      {["one", "two"].map((row) => (
        <div key={row} className="flex flex-col gap-2 px-4 py-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
      ))}
    </div>
  );
}
