"use client";

import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useBillingStatus } from "@/features/billing";
import { Link } from "@/lib/i18n/navigation";

export function ApiKeyUsage({
  apiV1BaseUrl,
  docsHref,
}: {
  apiV1BaseUrl: string;
  docsHref: string;
}) {
  const t = useTranslations("apiKeys.usage");
  const tBilling = useTranslations("billing");
  const tTools = useTranslations("tools");
  const { billing, isLoading, isError, errorKey } = useBillingStatus();
  const example = [
    `curl ${apiV1BaseUrl}/files \\`,
    '  -H "Authorization: Bearer YOUR_API_KEY"',
  ].join("\n");

  return (
    <section
      className="flex flex-col gap-6"
      aria-labelledby="api-key-usage-heading"
    >
      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <div className="flex flex-col gap-1">
          <h2
            id="api-key-usage-heading"
            className="text-sm font-medium text-foreground"
          >
            {t("statusTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("statusDescription")}
          </p>
        </div>
        {isLoading ? <Skeleton className="h-24 w-full" /> : null}
        {isError || (!isLoading && billing === undefined) ? (
          <Alert variant="destructive">
            <AlertDescription>
              {errorKey === null
                ? tBilling("errors.unexpected")
                : tBilling(`errors.${errorKey}`)}
            </AlertDescription>
          </Alert>
        ) : null}
        {billing !== undefined ? (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground">{t("credits")}</dt>
              <dd>
                {tBilling("usedOfLimit", {
                  used: billing.api.creditsUsed,
                  limit: billing.api.creditsLimit,
                })}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground">
                {tBilling("remainingLabel")}
              </dt>
              <dd>
                {tBilling("remaining", {
                  count: billing.api.creditsRemaining,
                })}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground">{t("rate")}</dt>
              <dd>
                {t("rateValue", {
                  count: billing.limits.apiRequestsPerMinute,
                })}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground">{t("keys")}</dt>
              <dd>
                {tBilling("usedOfLimit", {
                  used: billing.usage.apiKeyCount,
                  limit: billing.usage.apiKeyLimit,
                })}
              </dd>
            </div>
          </dl>
        ) : null}
        {billing !== undefined ? (
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-foreground">
              {tBilling("api.recentUsage")}
            </h3>
            {billing.api.recentUsage.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {tBilling("api.noUsage")}
              </p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {billing.api.recentUsage.map((entry) => (
                  <li
                    key={`${entry.createdAt}-${entry.type}-${entry.toolId ?? "none"}`}
                    className="flex flex-wrap items-baseline justify-between gap-2"
                  >
                    <span>
                      {entry.toolId === null
                        ? t("usageWithoutTool")
                        : tTools(`${entry.toolId}.name`)}
                    </span>
                    <span className="text-muted-foreground">
                      {t(`ledger.${entry.type}`, { amount: entry.amount })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-foreground">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
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
      </div>
    </section>
  );
}
