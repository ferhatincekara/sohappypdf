"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CreatedApiKeySecret } from "../lib/created-api-key-secret";
import { ApiKeyCreateForm } from "./api-key-create-form";
import { ApiKeyCreatedSecret } from "./api-key-created-secret";

export function ApiKeyCreateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("apiKeys.create");
  const tCreated = useTranslations("apiKeys.created");
  const openRef = useRef(open);
  const [created, setCreated] = useState<CreatedApiKeySecret | null>(null);
  openRef.current = open;

  const close = () => {
    setCreated(null);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          close();
        }
      }}
    >
      <DialogContent
        closeLabel={created === null ? t("close") : tCreated("close")}
      >
        <DialogHeader>
          <DialogTitle>
            {created === null ? t("title") : tCreated("title")}
          </DialogTitle>
          <DialogDescription>
            {created === null ? t("description") : tCreated("warning")}
          </DialogDescription>
        </DialogHeader>
        {created === null ? (
          <ApiKeyCreateForm
            onCreated={(next) => {
              if (!openRef.current) {
                return;
              }

              setCreated(next);
            }}
          />
        ) : (
          <div className="flex flex-col gap-6">
            <ApiKeyCreatedSecret created={created} />
            <Button type="button" variant="outline" onClick={close}>
              {tCreated("done")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
