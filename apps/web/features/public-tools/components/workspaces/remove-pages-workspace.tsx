"use client";

import { useTranslations } from "next-intl";
import { ToolFileCard } from "@/features/public-tools/components/tool-file-card";
import { ToolSelectedActions } from "@/features/public-tools/components/tool-selected-actions";
import { ToolSidebarCard } from "@/features/public-tools/components/tool-sidebar-card";
import { ToolStage } from "@/features/public-tools/components/tool-stage";
import { RemovePagesAdvanced } from "@/features/public-tools/components/workspaces/remove-pages-advanced";
import { RemoveResultSummary } from "@/features/public-tools/components/workspaces/remove-result-summary";
import { parseSelectedPagesInput } from "@/features/public-tools/lib/tool-workspace";
import {
  PdfPageWorkspace,
  pagesToRangeInput,
  usePdfDocument,
} from "@/features/public-tools/pdf-workspace";
import type { ToolSelectedWorkspaceProps } from "@/features/public-tools/types/tool-selected-workspace";

export type RemovePagesCopy = "remove" | "extract";

export function RemovePagesWorkspace({
  copy = "remove",
  ...props
}: ToolSelectedWorkspaceProps & { copy?: RemovePagesCopy }) {
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
      ? t(`workspaces.${copy}.selectPrompt`)
      : wouldRemoveAll
        ? t(`workspaces.${copy}.keepOnePage`)
        : null;

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
              aria-labelledby={`${copy}-heading`}
            >
              <div className="flex flex-col gap-1">
                <h2
                  id={`${copy}-heading`}
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
                selectedPages={selected}
                onSelectedPagesChange={setSelectedPages}
                disabled={props.disabled}
                passwordProtectedMessage={t(
                  `workspaces.${copy}.passwordProtected`,
                )}
                previewFailedMessage={t(`workspaces.${copy}.previewFailed`)}
                renderPageOverlay={(page) =>
                  page.selected ? (
                    <span className="absolute inset-x-0 bottom-1 z-10 flex justify-center">
                      <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-medium text-destructive-foreground">
                        {t(`workspaces.${copy}.willRemoveBadge`)}
                      </span>
                    </span>
                  ) : null
                }
              />
            </section>
          ) : null}
        </div>
      }
      sidebar={
        <ToolSidebarCard className="gap-5">
          {(pdf.status === "ready" || pdf.status === "error") &&
          props.state.error === null ? (
            <RemoveResultSummary
              copy={copy}
              selectedCount={selected.length}
              remainingCount={remaining}
              wouldRemoveAll={wouldRemoveAll}
            />
          ) : null}

          {props.state.error === null ? (
            <RemovePagesAdvanced
              copy={copy}
              selectedPages={selected}
              disabled={props.disabled}
              onSelectedPagesChange={setSelectedPages}
            />
          ) : null}

          <ToolSelectedActions
            toolRoute={props.tool.route}
            state={props.state}
            canProcess={canRemove}
            processLabel={props.processLabel}
            disabledReason={canRemove ? null : disabledReason}
            fullWidth
            onProcess={props.onProcess}
          />
        </ToolSidebarCard>
      }
    />
  );
}
