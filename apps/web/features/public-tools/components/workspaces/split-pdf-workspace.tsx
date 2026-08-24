"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePdfDocument } from "../../hooks/use-pdf-document";
import {
  allPages,
  pagesToRangeInput,
  rangesToPages,
  togglePage,
} from "../../lib/page-selection";
import { parseSplitRangesInput } from "../../lib/tool-workspace";
import type { ToolSelectedWorkspaceProps } from "../../types/tool-selected-workspace";
import { PdfPageGrid } from "../pdf-pages/pdf-page-grid";
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

        {pdf.status === "loading" ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
          </div>
        ) : null}

        {pdf.status === "error" ? (
          <p className="text-sm text-muted-foreground">
            {pdf.errorKey === "passwordProtected"
              ? t("workspaces.split.passwordProtected")
              : t("workspaces.split.previewFailed")}
          </p>
        ) : null}

        {pdf.status === "ready" && pdf.document !== null ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={props.disabled}
                onClick={() => {
                  setSelectedPages(allPages(pdf.pageCount));
                }}
              >
                {t("pages.selectAll")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={props.disabled || selectedPages.length === 0}
                onClick={() => {
                  setSelectedPages([]);
                }}
              >
                {t("pages.clear")}
              </Button>
              <p className="text-sm text-muted-foreground">
                {t("workspaces.split.selectedCount", {
                  count: selectedPages.length,
                })}
              </p>
            </div>
            <PdfPageGrid
              document={pdf.document}
              pageCount={pdf.pageCount}
              selectedPages={selectedPages}
              disabled={props.disabled}
              onToggle={(page) => {
                setSelectedPages(togglePage(selectedPages, page));
              }}
            />
            <p className="text-sm text-foreground">
              {t("workspaces.split.output", { count: selectedPages.length })}
            </p>
          </>
        ) : null}

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
