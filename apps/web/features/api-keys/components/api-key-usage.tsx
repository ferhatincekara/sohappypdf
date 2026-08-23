"use client";

import { useTranslations } from "next-intl";

const EXAMPLE_AUTHORIZATION = "Authorization: Bearer YOUR_API_KEY";

export function ApiKeyUsage() {
  const t = useTranslations("apiKeys.usage");

  return (
    <section
      className="flex flex-col gap-3"
      aria-labelledby="api-key-usage-heading"
    >
      <div className="flex flex-col gap-1">
        <h2
          id="api-key-usage-heading"
          className="text-sm font-medium text-foreground"
        >
          {t("title")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <pre className="overflow-x-auto rounded-xl border border-border bg-muted px-4 py-3 font-mono text-xs text-foreground">
        {EXAMPLE_AUTHORIZATION}
      </pre>
      <p className="text-sm text-muted-foreground">{t("docsHint")}</p>
    </section>
  );
}
