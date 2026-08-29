"use client";

import { KeyRoundIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isApiKeyDeletable } from "@/features/api-keys/lib/is-api-key-deletable";
import { maskApiKeyPrefix } from "@/features/api-keys/lib/mask-api-key-prefix";
import {
  PUBLIC_API_KEY_STATUSES,
  type PublicApiKey,
  type PublicApiKeyStatus,
} from "@/features/api-keys/types/api-key";
import { cn } from "@/lib/utils";

export function ApiKeyListItem({
  apiKey,
  onDelete,
}: {
  apiKey: PublicApiKey;
  onDelete: (apiKey: PublicApiKey) => void;
}) {
  const t = useTranslations("apiKeys.list");
  const tActions = useTranslations("apiKeys.actions");
  const formatter = useFormatter();
  const status = isPublicApiKeyStatus(apiKey.status) ? apiKey.status : "active";
  const created = t("created", {
    date: formatter.dateTime(new Date(apiKey.createdAt), {
      dateStyle: "medium",
      timeStyle: "short",
    }),
  });
  const used =
    apiKey.lastUsedAt === null
      ? t("neverUsed")
      : t("lastUsed", {
          date: formatter.dateTime(new Date(apiKey.lastUsedAt), {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        });
  const expires =
    apiKey.expiresAt === null
      ? null
      : t("expires", {
          date: formatter.dateTime(new Date(apiKey.expiresAt), {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        });

  return (
    <li
      className={cn(
        "flex flex-col gap-4 rounded-md bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5",
        status !== "active" && "opacity-70",
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted">
          <KeyRoundIcon
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-bold tracking-tight text-foreground">
              {apiKey.name}
            </p>
            <Badge
              size="sm"
              variant={status === "active" ? "secondary" : "muted"}
            >
              {t(`status.${status}`)}
            </Badge>
          </div>
          <p className="mt-2 truncate rounded-xl bg-muted px-3 py-1.5 font-mono text-xs text-foreground">
            {maskApiKeyPrefix(apiKey.keyPrefix)}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs leading-relaxed text-muted-foreground">
            <span>{created}</span>
            <span>{used}</span>
            {expires === null ? null : <span>{expires}</span>}
          </div>
        </div>
      </div>
      {isApiKeyDeletable(apiKey) ? (
        <Button
          type="button"
          size="xs"
          variant="destructive"
          className="shrink-0 self-start sm:self-center"
          aria-label={tActions("deleteNamed", { name: apiKey.name })}
          onClick={() => onDelete(apiKey)}
        >
          {tActions("delete")}
        </Button>
      ) : null}
    </li>
  );
}

function isPublicApiKeyStatus(value: string): value is PublicApiKeyStatus {
  return PUBLIC_API_KEY_STATUSES.some((status) => status === value);
}
