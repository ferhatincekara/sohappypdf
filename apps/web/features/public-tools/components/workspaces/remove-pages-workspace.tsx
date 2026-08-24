"use client";

import { useTranslations } from "next-intl";
import { parseSelectedPagesInput } from "../../lib/tool-workspace";
import {
  PdfPageWorkspace,
  pagesToRangeInput,
  usePdfDocument,
} from "../../pdf-workspace";
import type { ToolSelectedWorkspaceProps } from "../../types/tool-selected-workspace";
import { ToolFileCard } from "../tool-file-card";
import { ToolSelectedActions } from "../tool-selected-actions";
import { RemovePagesAdvanced } from "./remove-pages-advanced";
import { RemoveResultSummary } from "./remove-result-summary";

export function RemovePagesWorkspace(props: ToolSelectedWorkspaceProps) {
  const t = useTranslations("publicTools");
  const entry = props.state.files[0];
  const pdf = usePdfDocument(entry?.file ?? null);
  const selectedPages = parseSelectedPagesInput(
    props.workspaceState.pagesToRemove,
  );
  const selected = selectedPages ?? [];
  const remaining =
    pdf.status === "ready" ? Math.max(pdf.pageCount - selected.length, 0) : 0;
  const wouldRemoveAll =
    pdf.status === "ready" &&
    pdf.pageCount > 0 &&
    selected.length >= pdf.pageCount;
  const canRemove =
    props.canProcess &&
    selected.length > 0 &&
    !wouldRemoveAll &&
    entry !== undefined &&
    entry.status === "ready";

  if (entry === undefined) {
    return null;
  }

  function setSelectedPages(pages: readonly number[]): void {
    const next =
      pdf.status === "ready"
        ? pages.filter((page) => page >= 1 && page <= pdf.pageCount)
        : [...pages];

    props.setWorkspaceState({
      ...props.workspaceState,
      pagesToRemove: pagesToRangeInput(next),
    });
  }

  const disabledReason =
    selected.length === 0
      ? t("workspaces.remove.selectPrompt")
      : wouldRemoveAll
        ? t("workspaces.remove.keepOnePage")
        : null;

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

      <section className="flex flex-col gap-4" aria-labelledby="remove-heading">
        <div className="flex flex-col gap-1">
          <h2
            id="remove-heading"
            className="text-base font-semibold tracking-tight text-foreground"
          >
            {t("workspaces.remove.title")}
          </h2>
          <p className="text-sm text-muted-foreground text-pretty">
            {t("workspaces.remove.hint")}
          </p>
        </div>

        <PdfPageWorkspace
          pdf={pdf}
          selectedPages={selected}
          onSelectedPagesChange={setSelectedPages}
          disabled={props.disabled}
          passwordProtectedMessage={t("workspaces.remove.passwordProtected")}
          previewFailedMessage={t("workspaces.remove.previewFailed")}
          renderPageOverlay={(page) =>
            page.selected ? (
              <span className="absolute inset-x-0 bottom-1 z-10 flex justify-center">
                <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-medium text-destructive-foreground">
                  {t("workspaces.remove.willRemoveBadge")}
                </span>
              </span>
            ) : null
          }
        />
      </section>

      {pdf.status === "ready" || pdf.status === "error" ? (
        <RemoveResultSummary
          selectedCount={selected.length}
          remainingCount={remaining}
          wouldRemoveAll={wouldRemoveAll}
        />
      ) : null}

      <RemovePagesAdvanced
        selectedPages={selected}
        disabled={props.disabled}
        onSelectedPagesChange={setSelectedPages}
      />

      <ToolSelectedActions
        toolRoute={props.tool.route}
        state={props.state}
        canProcess={canRemove}
        processLabel={props.processLabel}
        disabledReason={disabledReason}
        onProcess={props.onProcess}
      />
    </div>
  );
}
