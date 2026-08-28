"use client";

import { CheckCircle2Icon, DownloadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { formatLabel } from "../lib/format-labels";
import type {
  ToolSuccessOutput,
  ToolSuccessUxState,
} from "../types/tool-ux-state";

export function ToolSuccessState({
  state,
  signupHref,
  isAuthenticated,
  isDownloading,
  title,
  description,
  downloadLabel,
  resetLabel,
  onDownload,
  onReset,
}: {
  state: ToolSuccessUxState;
  signupHref: string;
  isAuthenticated: boolean;
  isDownloading: boolean;
  title?: string;
  description?: string;
  downloadLabel?: string;
  resetLabel?: string;
  onDownload: (outputFileId?: string) => void;
  onReset: () => void;
}) {
  const t = useTranslations("publicTools");
  const isBatch = state.outputs.length > 1;
  const heading = isBatch
    ? t("result.titleBatch")
    : (title ?? t("result.title"));
  const detail = isBatch
    ? t("result.descriptionBatch", { count: state.outputs.length })
    : (description ??
      t("result.description", {
        format: formatLabel(state.targetFormat),
        source: state.sourceFilename ?? t("result.unnamedSource"),
      }));

  return (
    <div className="flex flex-col gap-5" role="status" aria-live="polite">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <CheckCircle2Icon
            className="size-5 text-foreground"
            aria-hidden="true"
          />
        </span>
        <div className="min-w-0 flex-1 pt-1">
          <h2 className="text-lg font-extrabold tracking-tight text-foreground">
            {heading}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
          {state.downloadError !== null ? (
            <p className="mt-2 text-sm text-destructive">
              {t(`errors.${state.downloadError.key}`)}
            </p>
          ) : null}
        </div>
      </div>

      {isBatch ? (
        <SuccessOutputList
          outputs={state.outputs}
          disabled={isDownloading}
          unnamedSource={t("result.unnamedSource")}
          downloadLabel={t("result.download")}
          listLabel={t("result.fileList")}
          onDownload={onDownload}
        />
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          size="lg"
          className="w-full sm:w-auto"
          disabled={isDownloading}
          autoFocus
          onClick={() => {
            onDownload();
          }}
        >
          <DownloadIcon data-icon="inline-start" />
          {isDownloading
            ? t("result.downloading")
            : isBatch
              ? t("result.downloadAll", { count: state.outputs.length })
              : (downloadLabel ?? t("actions.download"))}
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={onReset}
        >
          {resetLabel ?? t("actions.startAgain")}
        </Button>
      </div>

      {isAuthenticated ? null : (
        <p className="text-sm text-muted-foreground">
          {t("result.signupPrompt")}{" "}
          <Link
            href={signupHref}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {t("result.signupCta")}
          </Link>
        </p>
      )}
    </div>
  );
}

function SuccessOutputList({
  outputs,
  disabled,
  unnamedSource,
  downloadLabel,
  listLabel,
  onDownload,
}: {
  outputs: readonly ToolSuccessOutput[];
  disabled: boolean;
  unnamedSource: string;
  downloadLabel: string;
  listLabel: string;
  onDownload: (outputFileId: string) => void;
}) {
  return (
    <ul
      className="divide-y divide-black/10 overflow-hidden rounded-md bg-muted"
      aria-label={listLabel}
    >
      {outputs.map((output) => {
        const name = output.sourceFilename ?? unnamedSource;

        return (
          <li
            key={output.executionId}
            className="flex items-center gap-3 px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-sm font-medium text-foreground"
                title={name}
              >
                {name}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatLabel(output.targetFormat)}
              </p>
            </div>
            <Button
              type="button"
              size="xs"
              variant="white"
              disabled={disabled}
              onClick={() => {
                onDownload(output.outputFileId);
              }}
            >
              {downloadLabel}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
