"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useApiKeys } from "../hooks/use-api-keys";
import { useRevokeApiKey } from "../hooks/use-revoke-api-key";
import type { PublicApiKey } from "../types/api-key";
import { ApiKeyCreateDialog } from "./api-key-create-dialog";
import { ApiKeyList } from "./api-key-list";
import { ApiKeyRevokeDialog } from "./api-key-revoke-dialog";
import { ApiKeyUsage } from "./api-key-usage";

export function ApiKeysWorkspace() {
  const t = useTranslations("apiKeys");
  const tErrors = useTranslations("apiKeys.errors");
  const tRevoke = useTranslations("apiKeys.revoke");
  const { apiKeys, isLoading, isError, errorKey, refetch } = useApiKeys();
  const {
    revokeApiKey,
    isPending,
    errorKey: revokeErrorKey,
    reset,
  } = useRevokeApiKey();
  const [createOpen, setCreateOpen] = useState(false);
  const [keyToRevoke, setKeyToRevoke] = useState<PublicApiKey | null>(null);
  const [revokeSucceeded, setRevokeSucceeded] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium text-foreground">
            {t("list.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("list.description")}
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
          {t("actions.create")}
        </Button>
      </div>
      <div aria-live="polite" className="sr-only">
        {revokeSucceeded ? tRevoke("success") : ""}
      </div>
      {revokeSucceeded ? (
        <p className="text-sm text-foreground">{tRevoke("success")}</p>
      ) : null}
      <ApiKeyList
        apiKeys={apiKeys}
        isLoading={isLoading}
        isError={isError}
        errorMessage={
          errorKey === null ? tErrors("unexpected") : tErrors(errorKey)
        }
        onCreate={() => setCreateOpen(true)}
        onRevoke={(apiKey) => {
          reset();
          setRevokeSucceeded(false);
          setKeyToRevoke(apiKey);
        }}
        onRetry={() => {
          void refetch();
        }}
      />
      <ApiKeyUsage />
      <ApiKeyCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ApiKeyRevokeDialog
        apiKey={keyToRevoke}
        isPending={isPending}
        errorMessage={revokeErrorKey === null ? null : tErrors(revokeErrorKey)}
        onOpenChange={(open) => {
          if (!open) {
            setKeyToRevoke(null);
            reset();
          }
        }}
        onConfirm={() => {
          if (keyToRevoke === null) {
            return;
          }

          void revokeApiKey(keyToRevoke.id).then(() => {
            setKeyToRevoke(null);
            setRevokeSucceeded(true);
          });
        }}
      />
    </div>
  );
}
