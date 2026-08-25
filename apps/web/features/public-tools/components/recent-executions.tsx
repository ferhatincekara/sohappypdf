"use client";

import { useTranslations } from "next-intl";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/lib/i18n/navigation";
import { useRecentExecutions } from "../hooks/use-recent-executions";
import { PUBLIC_ANONYMOUS_RETENTION_HOURS } from "../lib/anonymous-limits";
import {
  compactAgeFrom,
  compactRemainingFrom,
} from "../lib/format-compact-age";
import type { RecentExecution } from "../types/recent-execution";

export function RecentExecutions() {
  const t = useTranslations("publicTools.recent");
  const tTools = useTranslations("tools");
  const recent = useRecentExecutions();

  return (
    <section
      aria-labelledby="recent-executions-heading"
      className="border-t border-border pt-8"
    >
      <div className="flex flex-col gap-1">
        <h2
          id="recent-executions-heading"
          className="text-sm font-medium tracking-tight text-muted-foreground"
        >
          {t("title")}
        </h2>
        <p className="text-xs text-muted-foreground text-pretty">
          {t("notice", { hours: PUBLIC_ANONYMOUS_RETENTION_HOURS })}
        </p>
      </div>

      {recent.isPending ? (
        <div className="mt-4 flex flex-col gap-2" aria-hidden="true">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : null}

      {recent.isError ? (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground" role="alert">
            {t("error")}
          </p>
          <div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                void recent.refetch();
              }}
            >
              {t("retry")}
            </Button>
          </div>
        </div>
      ) : null}

      {!recent.isPending &&
      !recent.isError &&
      recent.executions.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("empty")}</p>
      ) : null}

      {!recent.isPending && !recent.isError && recent.executions.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {recent.executions.map((execution) => (
            <RecentExecutionItem
              key={execution.id}
              execution={execution}
              toolName={tTools(`${execution.toolId}.name`)}
              isDownloading={recent.downloadingId === execution.id}
              onDownload={() => {
                void recent.download(execution);
              }}
            />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function RecentExecutionItem({
  execution,
  toolName,
  isDownloading,
  onDownload,
}: {
  execution: RecentExecution;
  toolName: string;
  isDownloading: boolean;
  onDownload: () => void;
}) {
  const t = useTranslations("publicTools.recent");
  const resultName = execution.resultFilename ?? t("unnamedFile");
  const sourceName = execution.sourceFilename;
  const showSource =
    sourceName !== null && sourceName.length > 0 && sourceName !== resultName;
  const age = compactAgeFrom(execution.createdAt);
  const remaining =
    execution.expiresAt === null || execution.status === "expired"
      ? null
      : compactRemainingFrom(execution.expiresAt);
  const ageLabel =
    age.unit === "justNow"
      ? t("age.justNow")
      : t(`age.${age.unit}`, { count: age.count });
  const remainingLabel =
    remaining === null
      ? null
      : t(`expiresIn.${remaining.unit}`, { count: remaining.count });
  const statusClassName =
    execution.status === "failed"
      ? "text-destructive"
      : "text-muted-foreground";

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border/80 bg-card/60 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {toolName}
        </p>
        <p className="mt-0.5 truncate text-sm text-foreground">{resultName}</p>
        {showSource ? (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {t("originalFile", { filename: sourceName })}
          </p>
        ) : null}
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span className={statusClassName}>
            {t(`status.${execution.status}`)}
          </span>
          <span aria-hidden="true">·</span>
          <time dateTime={execution.createdAt}>{ageLabel}</time>
          {remainingLabel !== null && execution.expiresAt !== null ? (
            <>
              <span aria-hidden="true">·</span>
              <time dateTime={execution.expiresAt}>{remainingLabel}</time>
            </>
          ) : null}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {execution.canDownload ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isDownloading}
            onClick={onDownload}
          >
            {isDownloading ? t("downloading") : t("download")}
          </Button>
        ) : null}
        {execution.status === "expired" ? (
          <Link
            href={execution.toolRoute}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            {t("startAgain")}
          </Link>
        ) : (
          <Link
            href={execution.toolRoute}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            {t("openTool")}
          </Link>
        )}
      </div>
    </li>
  );
}
