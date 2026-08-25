"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_PATHS } from "@/features/app-shell";
import { isConversionExpired } from "@/features/conversions/lib/can-download-conversion";
import { Link } from "@/lib/i18n/navigation";
import { useAccountOverviewActivity } from "../hooks/use-account-overview-activity";

export function AccountOverviewRecent() {
  const t = useTranslations("appShell.pages.overview");
  const tHistory = useTranslations("conversions.history");
  const tStatus = useTranslations("conversions.status");
  const tTools = useTranslations("tools");
  const tErrors = useTranslations("conversions.errors");
  const formatter = useFormatter();
  const { conversions, isLoading, isError, errorKey } =
    useAccountOverviewActivity();

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-sm font-medium text-foreground">
          {t("recentTitle")}
        </h2>
        <Link
          href={APP_PATHS.activity}
          className="text-sm font-medium underline underline-offset-4"
        >
          {t("viewActivity")}
        </Link>
      </div>
      {isLoading ? <Skeleton className="h-20 w-full" /> : null}
      {isError ? (
        <Alert variant="destructive">
          <AlertDescription>
            {errorKey === null ? tErrors("unexpected") : tErrors(errorKey)}
          </AlertDescription>
        </Alert>
      ) : null}
      {!isLoading && !isError && conversions.length === 0 ? (
        <p className="text-sm text-muted-foreground">{tHistory("empty")}</p>
      ) : null}
      {!isLoading && !isError && conversions.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {conversions.map((conversion) => {
            const expired = isConversionExpired(conversion);
            const statusLabel = expired
              ? tStatus("expired")
              : tStatus(conversion.status);

            return (
              <li
                key={conversion.id}
                className="flex flex-wrap items-baseline justify-between gap-2 text-sm"
              >
                <span className="min-w-0 truncate">
                  {tTools(`${conversion.type}.name`)}
                  <span className="text-muted-foreground">
                    {" · "}
                    {conversion.sourceFilename ?? tHistory("unnamedSource")}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  {statusLabel}
                  {" · "}
                  {formatter.relativeTime(new Date(conversion.createdAt))}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
