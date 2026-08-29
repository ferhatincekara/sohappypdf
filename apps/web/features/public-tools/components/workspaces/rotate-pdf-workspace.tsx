"use client";

import { RotateCcwIcon, RotateCwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ToolFileCard } from "@/features/public-tools/components/tool-file-card";
import { ToolSelectedActions } from "@/features/public-tools/components/tool-selected-actions";
import { ToolSidebarCard } from "@/features/public-tools/components/tool-sidebar-card";
import { ToolStage } from "@/features/public-tools/components/tool-stage";
import type { RotationDegrees } from "@/features/public-tools/lib/tool-workspace";
import { parseSelectedPagesInput } from "@/features/public-tools/lib/tool-workspace";
import {
  type PdfPage,
  PdfPageWorkspace,
  pagesToRangeInput,
  usePdfDocument,
} from "@/features/public-tools/pdf-workspace";
import type { ToolSelectedWorkspaceProps } from "@/features/public-tools/types/tool-selected-workspace";
import { cn } from "@/lib/utils";

export function RotatePdfWorkspace(props: ToolSelectedWorkspaceProps) {
  const t = useTranslations("publicTools");
  const entry = props.state.files[0];
  const pdf = usePdfDocument(entry?.file ?? null);
  const selectedPages = parseSelectedPagesInput(
    props.workspaceState.pageSelection,
  );
  const selected = selectedPages ?? [];

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
      pageSelection: pagesToRangeInput(next),
    });
  }

  function setDegrees(degrees: RotationDegrees): void {
    props.setWorkspaceState({
      ...props.workspaceState,
      rotationDegrees: degrees,
    });
  }

  const canRotate =
    props.canProcess && selected.length > 0 && entry.status === "ready";

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
              aria-labelledby="rotate-heading"
            >
              <div className="flex flex-col gap-1">
                <h2
                  id="rotate-heading"
                  className="text-lg font-extrabold tracking-tight text-foreground"
                >
                  {t("workspaces.rotate.title")}
                </h2>
                <p className="max-w-xl text-sm leading-relaxed text-muted-foreground text-pretty">
                  {t("workspaces.rotate.hint")}
                </p>
              </div>

              <PdfPageWorkspace
                pdf={pdf}
                selectedPages={selected}
                onSelectedPagesChange={setSelectedPages}
                disabled={props.disabled}
                passwordProtectedMessage={t(
                  "workspaces.rotate.passwordProtected",
                )}
                previewFailedMessage={t("workspaces.rotate.previewFailed")}
                mapPages={(pages) =>
                  pages.map((page) =>
                    applyRotatePreview(
                      page,
                      props.workspaceState.rotationDegrees,
                    ),
                  )
                }
                toolbarChildren={
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={
                        props.workspaceState.rotationDegrees === 270
                          ? "default"
                          : "outline"
                      }
                      disabled={props.disabled || selected.length === 0}
                      aria-pressed={
                        props.workspaceState.rotationDegrees === 270
                      }
                      onClick={() => {
                        setDegrees(270);
                      }}
                    >
                      <RotateCcwIcon className="size-3.5" aria-hidden="true" />
                      {t("workspaces.rotate.rotateLeft")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={
                        props.workspaceState.rotationDegrees === 90
                          ? "default"
                          : "outline"
                      }
                      disabled={props.disabled || selected.length === 0}
                      aria-pressed={props.workspaceState.rotationDegrees === 90}
                      onClick={() => {
                        setDegrees(90);
                      }}
                    >
                      <RotateCwIcon className="size-3.5" aria-hidden="true" />
                      {t("workspaces.rotate.rotateRight")}
                    </Button>
                  </div>
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
            <p
              className={cn(
                "text-sm font-medium",
                selected.length === 0
                  ? "text-muted-foreground"
                  : "text-foreground",
              )}
              aria-live="polite"
            >
              {selected.length === 0
                ? t("workspaces.rotate.selectPrompt")
                : t("workspaces.rotate.output", {
                    count: selected.length,
                    degrees: props.workspaceState.rotationDegrees,
                  })}
            </p>
          ) : null}

          <ToolSelectedActions
            toolRoute={props.tool.route}
            state={props.state}
            canProcess={canRotate}
            processLabel={props.processLabel}
            fullWidth
            onProcess={props.onProcess}
          />
        </ToolSidebarCard>
      }
    />
  );
}

function applyRotatePreview(page: PdfPage, degrees: RotationDegrees): PdfPage {
  if (!page.selected) {
    return page;
  }

  return { ...page, rotation: degrees };
}
