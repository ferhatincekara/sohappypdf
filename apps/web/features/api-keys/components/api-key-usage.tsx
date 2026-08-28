"use client";

import { useLocale, useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BillingCreditHistoryList, useBillingStatus } from "@/features/billing";
import { formatBillingDisplayDate } from "@/features/billing/lib/format-billing-date";
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
  const locale = useLocale();
  const { billing, isLoading, isError, errorKey } = useBillingStatus();
  const example = [
    `curl ${apiV1BaseUrl}/files \\`,
    '  -H "Authorization: Bearer YOUR_API_KEY"',
  ].join("\n");

  return (
    <Card
      className="rounded-7 bg-muted p-6 shadow-none md:p-7"
      aria-labelledby="api-key-usage-heading"
    >
      <div className="flex flex-col gap-1">
        <h2
          id="api-key-usage-heading"
          className="text-lg font-extrabold tracking-tight"
        >
          {t("statusTitle")}
        </h2>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          {t("statusDescription")}
        </p>
      </div>
      {isLoading ? (
        <div className="mt-6" aria-busy="true">
          <p className="sr-only">{t("loading")}</p>
          <ApiKeyUsageSkeleton />
        </div>
      ) : null}
      {isError || (!isLoading && billing === undefined) ? (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>
            {errorKey === null
              ? tBilling("errors.unexpected")
              : tBilling(`errors.${errorKey}`)}
          </AlertDescription>
        </Alert>
      ) : null}
      {billing !== undefined ? (
        <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <UsageStat
            label={t("credits")}
            value={tBilling("usedOfLimit", {
              used: billing.api.creditsUsed,
              limit: billing.api.creditsLimit,
            })}
          />
          <UsageStat
            label={tBilling("remainingLabel")}
            value={tBilling("remaining", {
              count: billing.api.creditsRemaining,
            })}
          />
          <UsageStat
            label={tBilling("api.resetLabel")}
            value={formatBillingDisplayDate(billing.api.periodEnd, locale)}
          />
          <UsageStat
            label={t("rate")}
            value={t("rateValue", {
              count: billing.limits.apiRequestsPerMinute,
            })}
          />
          <UsageStat
            label={t("keys")}
            value={tBilling("usedOfLimit", {
              used: billing.usage.apiKeyCount,
              limit: billing.usage.apiKeyLimit,
            })}
          />
        </dl>
      ) : null}
      {billing !== undefined ? (
        <div className="mt-8 border-t border-black/10 pt-6">
          <h3 className="text-sm font-bold tracking-tight">
            {tBilling("api.recentUsage")}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {tBilling("api.recentUsageHint")}
          </p>
          <div className="mt-2">
            <BillingCreditHistoryList entries={billing.api.recentUsage} />
          </div>
        </div>
      ) : null}
      <div className="mt-8 border-t border-black/10 pt-6">
        <h3 className="text-sm font-bold tracking-tight">{t("title")}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("description")}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          {t("baseUrlLabel")}{" "}
          <code className="rounded-full bg-white px-2 py-0.5 font-mono text-xs text-foreground">
            {apiV1BaseUrl}
          </code>
        </p>
        <pre className="mt-4 overflow-x-auto rounded-2xl bg-white px-4 py-3 font-mono text-xs text-foreground">
          {example}
        </pre>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {t("rotateHint")}
        </p>
        <p className="mt-3 text-sm">
          <Link
            href={docsHref}
            className="font-semibold underline underline-offset-4"
          >
            {t("docsLink")}
          </Link>
        </p>
      </div>
    </Card>
  );
}

function UsageStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white px-4 py-4">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-lg font-extrabold tracking-tight tabular-nums">
        {value}
      </dd>
    </div>
  );
}

const USAGE_STAT_SKELETON_IDS = [
  "credits",
  "remaining",
  "reset",
  "rate",
  "keys",
] as const;

const USAGE_HISTORY_SKELETON_IDS = ["one", "two", "three"] as const;

function ApiKeyUsageSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {USAGE_STAT_SKELETON_IDS.map((id) => (
          <div key={id} className="rounded-md bg-white px-4 py-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2 h-6 w-28" />
          </div>
        ))}
      </dl>
      <div className="border-t border-black/10 pt-6">
        <Skeleton className="h-4 w-36 bg-black/10" />
        <Skeleton className="mt-2 h-3 w-64 max-w-full bg-black/10" />
        <div className="mt-4 flex flex-col gap-2">
          {USAGE_HISTORY_SKELETON_IDS.map((id) => (
            <div
              key={id}
              className="flex flex-col gap-2 rounded-md bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
