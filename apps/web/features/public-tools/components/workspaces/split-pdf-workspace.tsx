"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { ToolFileCard } from "@/features/public-tools/components/tool-file-card";
import { ToolSelectedActions } from "@/features/public-tools/components/tool-selected-actions";
import { ToolSidebarCard } from "@/features/public-tools/components/tool-sidebar-card";
import { ToolStage } from "@/features/public-tools/components/tool-stage";
import { SplitAdvancedRanges } from "@/features/public-tools/components/workspaces/split-advanced-ranges";
import {
  formatSplitGroupLabel,
  groupsToRangeInput,
  rangesFromSplitAfter,
  splitAfterFromRanges,
  toggleSplitAfter,
} from "@/features/public-tools/lib/split-groups";
import { parseSplitRangesInput } from "@/features/public-tools/lib/tool-workspace";
import {
  PdfPageWorkspace,
  pagesToRangeInput,
  usePdfDocument,
} from "@/features/public-tools/pdf-workspace";
import type { ToolSelectedWorkspaceProps } from "@/features/public-tools/types/tool-selected-workspace";

export function SplitPdfWorkspace(props: ToolSelectedWorkspaceProps) {
  const t = useTranslations("publicTools");
  const entry = props.state.files[0];
  const pdf = usePdfDocument(entry?.file ?? null);
  const ranges =
    parseSplitRangesInput(props.workspaceState.splitRanges) ??
    (pdf.status === "ready" ? [{ start: 1, end: pdf.pageCount }] : []);
  const groups =
    pdf.status === "ready"
      ? rangesFromSplitAfter(pdf.pageCount, splitAfterFromRanges(ranges))
      : ranges;
  const splitAfter = splitAfterFromRanges(groups);

  useEffect(() => {
    if (
      pdf.status !== "ready" ||
      props.workspaceState.splitRanges.trim().length > 0
    ) {
      return;
    }

    props.setWorkspaceState({
      ...props.workspaceState,
      splitRanges: groupsToRangeInput([{ start: 1, end: pdf.pageCount }]),
      outputFormat: "pdf",
    });
  }, [
    pdf.pageCount,
    pdf.status,
    props.setWorkspaceState,
    props.workspaceState,
  ]);

  if (entry === undefined) {
    return null;
  }

  function applyGroups(nextGroups: readonly { start: number; end: number }[]) {
    const usesZip = nextGroups.length > 1;

    props.setWorkspaceState({
      ...props.workspaceState,
      splitRanges: groupsToRangeInput(nextGroups),
      outputFormat: usesZip ? "zip" : "pdf",
    });
  }

  function applySplitAfter(next: readonly number[]) {
    if (pdf.status !== "ready") {
      return;
    }

    applyGroups(rangesFromSplitAfter(pdf.pageCount, next));
  }

  const canSplit =
    props.canProcess && groups.length > 0 && entry.status === "ready";

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
              aria-labelledby="split-pages-heading"
            >
              <div className="flex flex-col gap-1">
                <h2
                  id="split-pages-heading"
                  className="text-lg font-extrabold tracking-tight text-foreground"
                >
                  {t("workspaces.split.title")}
                </h2>
                <p className="max-w-xl text-sm leading-relaxed text-muted-foreground text-pretty">
                  {t("workspaces.split.hint")}
                </p>
              </div>

              <PdfPageWorkspace
                pdf={pdf}
                selectedPages={splitAfter}
                onSelectedPagesChange={() => undefined}
                showToolbar={false}
                disabled={props.disabled}
                passwordProtectedMessage={t(
                  "workspaces.split.passwordProtected",
                )}
                previewFailedMessage={t("workspaces.split.previewFailed")}
                renderPageOverlay={(page) =>
                  pdf.status === "ready" && page.pageNumber < pdf.pageCount ? (
                    <button
                      type="button"
                      className="absolute inset-x-2 bottom-2 rounded-md bg-background/95 px-2 py-1 text-xs font-semibold text-foreground shadow-sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        applySplitAfter(
                          toggleSplitAfter(splitAfter, page.pageNumber),
                        );
                      }}
                    >
                      {splitAfter.includes(page.pageNumber)
                        ? t("workspaces.split.removeSplit")
                        : t("workspaces.split.splitHere")}
                    </button>
                  ) : null
                }
              />
            </section>
          ) : null}
        </div>
      }
      sidebar={
        <ToolSidebarCard className="gap-5">
          <section className="flex flex-col gap-3" aria-live="polite">
            <h2 className="text-base font-extrabold tracking-tight text-foreground">
              {t("workspaces.split.partsTitle")}
            </h2>
            {groups.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("workspaces.split.selectPrompt")}
              </p>
            ) : (
              <ol className="space-y-2">
                {groups.map((group, index) => (
                  <li key={`${group.start}-${group.end}`} className="text-sm">
                    <p className="font-semibold text-foreground">
                      {t("workspaces.split.partLabel", { index: index + 1 })}
                    </p>
                    <p className="text-muted-foreground">
                      {t("workspaces.split.partPages", {
                        pages: formatSplitGroupLabel(group),
                      })}
                    </p>
                  </li>
                ))}
              </ol>
            )}
            <p className="text-sm font-medium text-foreground">
              {groups.length > 1
                ? t("workspaces.split.outputZip", { count: groups.length })
                : t("workspaces.split.outputOne")}
            </p>
          </section>

          {props.state.error === null ? (
            <SplitAdvancedRanges
              copy="split"
              selectedPages={groups.flatMap((group) => {
                const pages: number[] = [];
                for (let page = group.start; page <= group.end; page += 1) {
                  pages.push(page);
                }
                return pages;
              })}
              disabled={props.disabled}
              onSelectedPagesChange={(pages) => {
                if (pdf.status !== "ready") {
                  return;
                }

                const nextRanges = parseSplitRangesInput(
                  pagesToRangeInput(pages),
                );
                applyGroups(nextRanges ?? [{ start: 1, end: pdf.pageCount }]);
              }}
            />
          ) : null}

          <ToolSelectedActions
            toolRoute={props.tool.route}
            state={props.state}
            canProcess={canSplit}
            processLabel={props.processLabel}
            fullWidth
            onProcess={props.onProcess}
          />
        </ToolSidebarCard>
      }
    />
  );
}
