"use client";

import { useTranslations } from "next-intl";
import { selectedPagesFromSplitRanges } from "../../lib/split-selection";
import {
  PdfPageWorkspace,
  pagesToRangeInput,
  usePdfDocument,
} from "../../pdf-workspace";
import type { ToolSelectedWorkspaceProps } from "../../types/tool-selected-workspace";
import { ToolFileCard } from "../tool-file-card";
import { ToolSelectedActions } from "../tool-selected-actions";
import { SplitAdvancedRanges } from "./split-advanced-ranges";
import { SplitResultSummary } from "./split-result-summary";

export type KeepSelectedPagesCopy = "split" | "extract";

export function KeepSelectedPagesWorkspace({
  copy,
  ...props
}: ToolSelectedWorkspaceProps & { copy: KeepSelectedPagesCopy }) {
  const t = useTranslations("publicTools");
  const entry = props.state.files[0];
  const pdf = usePdfDocument(entry?.file ?? null);
  const selectedPages = selectedPagesFromSplitRanges(
    props.workspaceState.splitRanges,
  );
  const isAllSelected =
    pdf.status === "ready" &&
    pdf.pageCount > 0 &&
    selectedPages.length === pdf.pageCount;

  if (entry === undefined) {
    return null;
  }

  function setSelectedPages(pages: readonly number[]) {
    const next =
      pdf.status === "ready"
        ? pages.filter((page) => page >= 1 && page <= pdf.pageCount)
        : [...pages];

    props.setWorkspaceState({
      ...props.workspaceState,
      splitRanges: pagesToRangeInput(next),
    });
  }

  const canExtract =
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
        aria-labelledby={`${copy}-pages-heading`}
      >
        <div className="flex flex-col gap-1">
          <h2
            id={`${copy}-pages-heading`}
            className="text-base font-semibold tracking-tight text-foreground"
          >
            {t(`workspaces.${copy}.title`)}
          </h2>
          <p className="text-sm text-muted-foreground text-pretty">
            {t(`workspaces.${copy}.hint`)}
          </p>
        </div>

        <PdfPageWorkspace
          pdf={pdf}
          selectedPages={selectedPages}
          onSelectedPagesChange={setSelectedPages}
          disabled={props.disabled}
          passwordProtectedMessage={t(`workspaces.${copy}.passwordProtected`)}
          previewFailedMessage={t(`workspaces.${copy}.previewFailed`)}
        />
      </section>

      {pdf.status === "ready" || pdf.status === "error" ? (
        <SplitResultSummary
          copy={copy}
          selectedCount={selectedPages.length}
          pageCount={pdf.pageCount}
          isAllSelected={isAllSelected}
        />
      ) : null}

      <SplitAdvancedRanges
        copy={copy}
        selectedPages={selectedPages}
        disabled={props.disabled}
        onSelectedPagesChange={setSelectedPages}
      />

      <ToolSelectedActions
        toolRoute={props.tool.route}
        state={props.state}
        canProcess={canExtract}
        processLabel={props.processLabel}
        disabledReason={
          selectedPages.length === 0
            ? t(`workspaces.${copy}.selectPrompt`)
            : null
        }
        onProcess={props.onProcess}
      />
    </div>
  );
}
