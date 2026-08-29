"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiKeyCreateDialog } from "@/features/api-keys/components/api-key-create-dialog";
import { ApiKeyList } from "@/features/api-keys/components/api-key-list";
import { ApiKeyRevokeDialog } from "@/features/api-keys/components/api-key-revoke-dialog";
import { ApiKeyUsage } from "@/features/api-keys/components/api-key-usage";
import { useApiKeys } from "@/features/api-keys/hooks/use-api-keys";
import { useRevokeApiKey } from "@/features/api-keys/hooks/use-revoke-api-key";
import type { PublicApiKey } from "@/features/api-keys/types/api-key";

export function ApiKeysWorkspace({
  apiV1BaseUrl,
  docsHref,
}: {
  apiV1BaseUrl: string;
  docsHref: string;
}) {
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
      <Card className="rounded-7 bg-muted p-6 shadow-none md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex max-w-md flex-col gap-1">
            <h2 className="text-lg font-extrabold tracking-tight">
              {t("list.title")}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("list.description")}
            </p>
          </div>
          <Button type="button" onClick={() => setCreateOpen(true)}>
            {t("actions.create")}
          </Button>
        </div>
        <div aria-live="polite" className="sr-only">
          {revokeSucceeded ? tRevoke("success") : ""}
        </div>
        {revokeSucceeded ? (
          <p className="mt-4 text-sm font-medium">{tRevoke("success")}</p>
        ) : null}
        <div className="mt-6">
          <ApiKeyList
            apiKeys={apiKeys}
            isLoading={isLoading}
            isError={isError}
            errorMessage={
              errorKey === null ? tErrors("unexpected") : tErrors(errorKey)
            }
            onRevoke={(apiKey) => {
              reset();
              setRevokeSucceeded(false);
              setKeyToRevoke(apiKey);
            }}
            onRetry={() => {
              void refetch();
            }}
          />
        </div>
      </Card>
      <ApiKeyUsage apiV1BaseUrl={apiV1BaseUrl} docsHref={docsHref} />
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
