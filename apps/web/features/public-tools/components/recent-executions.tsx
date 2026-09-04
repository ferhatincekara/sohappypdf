"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConversionActivityRow } from "@/features/conversions/components/conversion-activity-row";
import {
  activityAgeFrom,
  activityAgeLabel,
  activityRemainingFrom,
  activityRemainingLabel,
} from "@/features/conversions/lib/activity-time-copy";
import { useRecentExecutions } from "@/features/public-tools/hooks/use-recent-executions";
import { PUBLIC_ANONYMOUS_RETENTION_HOURS } from "@/features/public-tools/lib/anonymous-limits";
import type { RecentExecution } from "@/features/public-tools/types/recent-execution";
import { Link } from "@/lib/i18n/navigation";

export function RecentExecutions({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const t = useTranslations("publicTools.recent");
  const tTools = useTranslations("tools");
  const recent = useRecentExecutions({ authenticated: isAuthenticated });
  const hours = PUBLIC_ANONYMOUS_RETENTION_HOURS;

  return (
    <section
      aria-labelledby="recent-executions-heading"
      className="flex flex-col gap-4 md:gap-5"
    >
      <div className="flex flex-col gap-1">
        <h2
          id="recent-executions-heading"
          className="text-lg font-extrabold tracking-tight md:text-xl"
        >
          {t("title")}
        </h2>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          {t("notice", { hours })}
        </p>
      </div>

      {recent.isPending ? (
        <div className="flex flex-col gap-2" aria-hidden="true">
          <Skeleton className="h-20 w-full rounded-md" />
          <Skeleton className="h-20 w-full rounded-md" />
        </div>
      ) : null}

      {recent.isError ? (
        <RecentExecutionsPanel role="alert">
          <p className="text-base font-extrabold tracking-tight">
            {t("error")}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {t("notice", { hours })}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-4"
            onClick={() => {
              void recent.refetch();
            }}
          >
            {t("retry")}
          </Button>
        </RecentExecutionsPanel>
      ) : null}

      {!recent.isPending &&
      !recent.isError &&
      recent.executions.length === 0 ? (
        <RecentExecutionsPanel>
          <p className="text-base font-extrabold tracking-tight">
            {t("empty")}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {t("emptyHint", { hours })}
          </p>
        </RecentExecutionsPanel>
      ) : null}

      {!recent.isPending && !recent.isError && recent.executions.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {recent.executions.map((execution) => (
            <RecentExecutionItem
              key={execution.id}
              execution={execution}
              now={recent.now}
              toolName={tTools(`${execution.toolId}.name`)}
              downloading={recent.downloadingId === execution.id}
              onDownload={recent.download}
            />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function RecentExecutionsPanel({
  children,
  role,
}: {
  children: ReactNode;
  role?: "alert";
}) {
  return (
    <div
      role={role}
      className="rounded-3xl bg-muted px-5 py-6 md:px-6 md:py-10"
    >
      {children}
    </div>
  );
}

function RecentExecutionItem({
  execution,
  now,
  toolName,
  downloading,
  onDownload,
}: {
  execution: RecentExecution;
  now: Date;
  toolName: string;
  downloading: boolean;
  onDownload: (execution: RecentExecution) => Promise<void>;
}) {
  const t = useTranslations("publicTools.recent");
  const tActions = useTranslations("files.actions");
  const tAge = useTranslations("publicTools.recent.age");
  const tExpires = useTranslations("publicTools.recent.expiresIn");
  const resultName = execution.resultFilename ?? t("unnamedFile");
  const sourceName = execution.sourceFilename;
  const showSource =
    sourceName !== null && sourceName.length > 0 && sourceName !== resultName;
  const remaining = activityRemainingFrom(
    execution.expiresAt,
    execution.status === "expired",
    now,
  );

  return (
    <ConversionActivityRow
      title={toolName}
      subtitle={resultName}
      detail={showSource ? t("originalFile", { filename: sourceName }) : null}
      statusLabel={t(`status.${execution.status}`)}
      statusTone={
        execution.status === "ready"
          ? "ready"
          : execution.status === "failed"
            ? "failed"
            : "neutral"
      }
      createdAt={execution.createdAt}
      createdLabel={activityAgeLabel(
        activityAgeFrom(execution.createdAt, now),
        tAge,
      )}
      expiresAt={execution.expiresAt}
      expiresLabel={
        remaining !== null &&
        remaining.unit === "minutes" &&
        remaining.count <= 15
          ? t("expiresSoon")
          : activityRemainingLabel(remaining, tExpires)
      }
      actions={
        <>
          {execution.canDownload && execution.outputFileId !== null ? (
            <Button
              type="button"
              size="sm"
              disabled={downloading}
              onClick={() => {
                void onDownload(execution);
              }}
            >
              {downloading ? tActions("downloading") : tActions("download")}
            </Button>
          ) : null}
          <Button
            variant="white"
            size="sm"
            nativeButton={false}
            render={<Link href={execution.toolRoute} />}
          >
            {execution.status === "expired" ? t("startAgain") : t("openTool")}
          </Button>
        </>
      }
    />
  );
}
