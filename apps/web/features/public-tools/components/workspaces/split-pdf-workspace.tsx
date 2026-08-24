"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { parseSplitRangesInput } from "../../lib/tool-workspace";
import {
  PdfPageWorkspace,
  pagesToRangeInput,
  rangesToPages,
  usePdfDocument,
} from "../../pdf-workspace";
import type { ToolSelectedWorkspaceProps } from "../../types/tool-selected-workspace";
import { ToolFileCard } from "../tool-file-card";
import { ToolSelectedActions } from "../tool-selected-actions";

export function SplitPdfWorkspace(props: ToolSelectedWorkspaceProps) {
  const t = useTranslations("publicTools");
  const entry = props.state.files[0];
  const pdf = usePdfDocument(entry?.file ?? null);
  const selectedPages = useMemo(() => {
    const ranges = parseSplitRangesInput(props.workspaceState.splitRanges);
    return ranges === undefined ? [] : rangesToPages(ranges);
  }, [props.workspaceState.splitRanges]);

  if (entry === undefined) {
    return null;
  }

  function setSelectedPages(pages: readonly number[]) {
    props.setWorkspaceState({
      ...props.workspaceState,
      splitRanges: pagesToRangeInput(pages),
    });
  }

  const canSplit =
    props.canProcess && selectedPages.length > 0 && entry.status === "ready";

  return (
    <div className="flex flex-col gap-6">
      <ToolFileCard
        entry={entry}
        pageCount={pdf.status === "ready" ? pdf.pageCount : entry.pageCount}
        accept={props.accept}
        disabled={props.disabled}
        onRemove={() => {
          props.onRemove(entry.id);
        }}
        onReplace={props.onReplaceFiles}
        onRetry={() => {
          props.onRetryUpload(entry.id);
        }}
      />

      <section
        className="flex flex-col gap-4"
        aria-labelledby="split-pages-heading"
      >
        <div className="flex flex-col gap-1">
          <h2
            id="split-pages-heading"
            className="text-base font-semibold tracking-tight text-foreground"
          >
            {t("workspaces.split.title")}
          </h2>
          <p className="text-sm text-muted-foreground text-pretty">
            {t("workspaces.split.hint")}
          </p>
        </div>

        <PdfPageWorkspace
          pdf={pdf}
          selectedPages={selectedPages}
          onSelectedPagesChange={(pages) => {
            setSelectedPages(pages);
          }}
          disabled={props.disabled}
          passwordProtectedMessage={t("workspaces.split.passwordProtected")}
          previewFailedMessage={t("workspaces.split.previewFailed")}
        >
          {pdf.status === "ready" ? (
            <p className="text-sm text-foreground">
              {t("workspaces.split.output", { count: selectedPages.length })}
            </p>
          ) : null}
        </PdfPageWorkspace>

        <details className="rounded-lg border border-border bg-card p-3">
          <summary className="cursor-pointer text-sm font-medium text-foreground">
            {t("workspaces.split.advanced")}
          </summary>
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">
              {t("workspaces.split.advancedHint")}
            </p>
            <Input
              value={props.workspaceState.splitRanges}
              disabled={props.disabled}
              placeholder={t("options.splitRangesPlaceholder")}
              aria-label={t("workspaces.split.advanced")}
              onChange={(event) => {
                props.setWorkspaceState({
                  ...props.workspaceState,
                  splitRanges: event.target.value,
                });
              }}
            />
          </div>
        </details>
      </section>

      <ToolSelectedActions
        toolRoute={props.tool.route}
        state={props.state}
        canProcess={canSplit}
        processLabel={props.processLabel}
        disabledReason={
          selectedPages.length === 0 ? t("workspaces.split.selectPrompt") : null
        }
        onProcess={props.onProcess}
      />
    </div>
  );
}
