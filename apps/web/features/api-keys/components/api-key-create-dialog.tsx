"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          close();
        }
      }}
    >
      <SheetContent
        side="bottom"
        closeLabel={created === null ? t("close") : tCreated("close")}
        className="max-h-[90dvh] w-full gap-0 rounded-t-xl border-t sm:mx-auto sm:max-w-lg"
      >
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>
            {created === null ? t("title") : tCreated("title")}
          </SheetTitle>
          <SheetDescription>
            {created === null ? t("description") : tCreated("warning")}
          </SheetDescription>
        </SheetHeader>
        <div className="overflow-y-auto px-6 pb-8 pt-2">
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
