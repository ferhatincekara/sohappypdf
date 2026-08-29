"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { copyTextToClipboard } from "@/features/api-keys/lib/copy-text";
import type { CreatedApiKeySecret } from "@/features/api-keys/lib/created-api-key-secret";

export function ApiKeyCreatedSecret({
  created,
}: {
  created: CreatedApiKeySecret;
}) {
  const t = useTranslations("apiKeys.created");
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-muted-foreground">
        {t("store")}
      </p>
      <div className="flex flex-col gap-2">
        <label
          className="text-sm font-medium text-foreground"
          htmlFor="api-key-secret"
        >
          {t("label", { name: created.name })}
        </label>
        <input
          id="api-key-secret"
          readOnly
          value={created.secret}
          onFocus={(event) => {
            event.currentTarget.select();
          }}
          className="w-full min-w-0 rounded-2xl border-2 border-input bg-white px-4 py-2 font-mono text-sm text-foreground outline-none"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          size="sm"
          onClick={() => {
            void copyTextToClipboard(created.secret).then((ok) => {
              setCopied(ok);
              setCopyFailed(!ok);
            });
          }}
        >
          {t("copy")}
        </Button>
        {copied ? (
          <p className="text-sm text-foreground" role="status">
            {t("copied")}
          </p>
        ) : null}
        {copyFailed ? (
          <p className="text-sm text-destructive" role="alert">
            {t("copyFailed")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
