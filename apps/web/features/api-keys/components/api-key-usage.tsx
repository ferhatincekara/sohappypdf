"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";

export function ApiKeyUsage({
  apiV1BaseUrl,
  docsHref,
}: {
  apiV1BaseUrl: string;
  docsHref: string;
}) {
  const t = useTranslations("apiKeys.usage");
  const example = [
    `curl ${apiV1BaseUrl}/files \\`,
    '  -H "Authorization: Bearer YOUR_API_KEY"',
  ].join("\n");

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
      <p className="text-sm text-muted-foreground">
        {t("baseUrlLabel")} <code>{apiV1BaseUrl}</code>
      </p>
      <pre className="overflow-x-auto rounded-xl border border-border bg-muted px-4 py-3 font-mono text-xs text-foreground">
        {example}
      </pre>
      <p className="text-sm text-muted-foreground">{t("rotateHint")}</p>
      <p className="text-sm text-muted-foreground">
        <Link href={docsHref} className="underline underline-offset-4">
          {t("docsLink")}
        </Link>
      </p>
    </section>
  );
}
