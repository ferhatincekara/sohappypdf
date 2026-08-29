"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiKeyCreateDialog } from "@/features/api-keys/components/api-key-create-dialog";
import { ApiKeyDeleteDialog } from "@/features/api-keys/components/api-key-delete-dialog";
import { ApiKeyList } from "@/features/api-keys/components/api-key-list";
import { ApiKeyUsage } from "@/features/api-keys/components/api-key-usage";
import { useApiKeys } from "@/features/api-keys/hooks/use-api-keys";
import { useDeleteApiKey } from "@/features/api-keys/hooks/use-delete-api-key";
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
  const tDelete = useTranslations("apiKeys.delete");
  const { apiKeys, isLoading, isError, errorKey, refetch } = useApiKeys();
  const {
    deleteApiKey,
    isPending,
    errorKey: deleteErrorKey,
    reset,
  } = useDeleteApiKey();
  const [createOpen, setCreateOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<PublicApiKey | null>(null);
  const [deleteSucceeded, setDeleteSucceeded] = useState(false);

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
          {deleteSucceeded ? tDelete("success") : ""}
        </div>
        {deleteSucceeded ? (
          <p className="mt-4 text-sm font-medium">{tDelete("success")}</p>
        ) : null}
        <div className="mt-6">
          <ApiKeyList
            apiKeys={apiKeys}
            isLoading={isLoading}
            isError={isError}
            errorMessage={
              errorKey === null ? tErrors("unexpected") : tErrors(errorKey)
            }
            onDelete={(apiKey) => {
              reset();
              setDeleteSucceeded(false);
              setKeyToDelete(apiKey);
            }}
            onRetry={() => {
              void refetch();
            }}
          />
        </div>
      </Card>
      <ApiKeyUsage apiV1BaseUrl={apiV1BaseUrl} docsHref={docsHref} />
      <ApiKeyCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ApiKeyDeleteDialog
        apiKey={keyToDelete}
        isPending={isPending}
        errorMessage={deleteErrorKey === null ? null : tErrors(deleteErrorKey)}
        onOpenChange={(open) => {
          if (!open) {
            setKeyToDelete(null);
            reset();
          }
        }}
        onConfirm={() => {
          if (keyToDelete === null) {
            return;
          }

          void deleteApiKey(keyToDelete.id).then(() => {
            setKeyToDelete(null);
            setDeleteSucceeded(true);
          });
        }}
      />
    </div>
  );
}
