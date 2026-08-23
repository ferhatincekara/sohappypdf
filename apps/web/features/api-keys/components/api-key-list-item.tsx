"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { isApiKeyRevocable } from "../lib/is-api-key-revocable";
import { maskApiKeyPrefix } from "../lib/mask-api-key-prefix";
import {
  PUBLIC_API_KEY_STATUSES,
  type PublicApiKey,
  type PublicApiKeyStatus,
} from "../types/api-key";

export function ApiKeyListItem({
  apiKey,
  onRevoke,
}: {
  apiKey: PublicApiKey;
  onRevoke: (apiKey: PublicApiKey) => void;
}) {
  const t = useTranslations("apiKeys.list");
  const tActions = useTranslations("apiKeys.actions");
  const formatter = useFormatter();
  const status = isPublicApiKeyStatus(apiKey.status) ? apiKey.status : "active";

  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {apiKey.name}
        </p>
        <p className="break-all font-mono text-xs text-muted-foreground">
          {maskApiKeyPrefix(apiKey.keyPrefix)}
        </p>
        <p className="text-xs text-muted-foreground">
          {t(`status.${status}`)}
          <span aria-hidden="true"> · </span>
          {t("created", {
            date: formatter.dateTime(new Date(apiKey.createdAt), {
              dateStyle: "medium",
              timeStyle: "short",
            }),
          })}
        </p>
        {apiKey.lastUsedAt === null ? (
          <p className="text-xs text-muted-foreground">{t("neverUsed")}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {t("lastUsed", {
              date: formatter.dateTime(new Date(apiKey.lastUsedAt), {
                dateStyle: "medium",
                timeStyle: "short",
              }),
            })}
          </p>
        )}
        {apiKey.expiresAt === null ? null : (
          <p className="text-xs text-muted-foreground">
            {t("expires", {
              date: formatter.dateTime(new Date(apiKey.expiresAt), {
                dateStyle: "medium",
                timeStyle: "short",
              }),
            })}
          </p>
        )}
      </div>
      {isApiKeyRevocable(apiKey) ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          aria-label={tActions("revokeNamed", { name: apiKey.name })}
          onClick={() => onRevoke(apiKey)}
        >
          {tActions("revoke")}
        </Button>
      ) : null}
    </li>
  );
}

function isPublicApiKeyStatus(value: string): value is PublicApiKeyStatus {
  return PUBLIC_API_KEY_STATUSES.some((status) => status === value);
}
