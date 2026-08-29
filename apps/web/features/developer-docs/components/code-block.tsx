"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { copyTextToClipboard } from "@/features/developer-docs/lib/copy-text";

export function CodeBlock({ code, label }: { code: string; label?: string }) {
  const t = useTranslations("developerDocs");
  const [copied, setCopied] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-muted">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
        <p className="truncate text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {label ?? t("codeLabel")}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => {
            void copyTextToClipboard(code).then((ok) => {
              if (!ok) {
                return;
              }

              setCopied(true);
              window.setTimeout(() => {
                setCopied(false);
              }, 1600);
            });
          }}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? t("copied") : t("copy")}
        </Button>
      </div>
      <pre className="overflow-x-auto px-4 py-3 font-mono text-xs leading-relaxed text-foreground">
        {code}
      </pre>
    </div>
  );
}
