"use client";

import { useTranslations } from "next-intl";
import { ToolFileCard } from "@/features/public-tools/components/tool-file-card";
import { ToolSelectedActions } from "@/features/public-tools/components/tool-selected-actions";
import { ToolSidebarCard } from "@/features/public-tools/components/tool-sidebar-card";
import { ToolStage } from "@/features/public-tools/components/tool-stage";
import { SplitAdvancedRanges } from "@/features/public-tools/components/workspaces/split-advanced-ranges";
import { SplitResultSummary } from "@/features/public-tools/components/workspaces/split-result-summary";
import { selectedPagesFromSplitRanges } from "@/features/public-tools/lib/split-selection";
import {
  PdfPageWorkspace,
  pagesToRangeInput,
  usePdfDocument,
} from "@/features/public-tools/pdf-workspace";
import type { ToolSelectedWorkspaceProps } from "@/features/public-tools/types/tool-selected-workspace";

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
    <ToolStage
      main={
        <div className="flex flex-col gap-6">
          <ToolFileCard
            entry={entry}
            pageCount={pdf.status === "ready" ? pdf.pageCount : entry.pageCount}
            accept={props.accept}
            disabled={props.disabled}
            maxPagesPerFile={props.maxPagesPerFile}
            onRemove={() => {
              props.onRemove(entry.id);
            }}
            onReplace={props.onReplaceFiles}
            onRetry={() => {
              props.onRetryUpload(entry.id);
            }}
          />

          {props.state.error === null ? (
            <section
              className="flex flex-col gap-4"
              aria-labelledby={`${copy}-pages-heading`}
            >
              <div className="flex flex-col gap-1">
                <h2
                  id={`${copy}-pages-heading`}
                  className="text-lg font-extrabold tracking-tight text-foreground"
                >
                  {t(`workspaces.${copy}.title`)}
                </h2>
                <p className="max-w-xl text-sm leading-relaxed text-muted-foreground text-pretty">
                  {t(`workspaces.${copy}.hint`)}
                </p>
              </div>

              <PdfPageWorkspace
                pdf={pdf}
                selectedPages={selectedPages}
                onSelectedPagesChange={setSelectedPages}
                disabled={props.disabled}
                passwordProtectedMessage={t(
                  `workspaces.${copy}.passwordProtected`,
                )}
                previewFailedMessage={t(`workspaces.${copy}.previewFailed`)}
              />
            </section>
          ) : null}
        </div>
      }
      sidebar={
        <ToolSidebarCard className="gap-5">
          {(pdf.status === "ready" || pdf.status === "error") &&
          props.state.error === null ? (
            <SplitResultSummary
              copy={copy}
              selectedCount={selectedPages.length}
              pageCount={pdf.pageCount}
              isAllSelected={isAllSelected}
            />
          ) : null}

          {props.state.error === null ? (
            <SplitAdvancedRanges
              copy={copy}
              selectedPages={selectedPages}
              disabled={props.disabled}
              onSelectedPagesChange={setSelectedPages}
            />
          ) : null}

          <ToolSelectedActions
            toolRoute={props.tool.route}
            state={props.state}
            canProcess={canExtract}
            processLabel={props.processLabel}
            fullWidth
            onProcess={props.onProcess}
          />
        </ToolSidebarCard>
      }
    />
  );
}
