"use client";

import { useTranslations } from "next-intl";
import { usePdfDocument } from "../../pdf-workspace";
import type { ToolSelectedWorkspaceProps } from "../../types/tool-selected-workspace";
import { ToolFileCard } from "../tool-file-card";
import { ToolSelectedActions } from "../tool-selected-actions";
import { CropPagePreview } from "./crop-page-preview";

export function CropPdfWorkspace(props: ToolSelectedWorkspaceProps) {
  const t = useTranslations("publicTools");
  const entry = props.state.files[0];
  const pdf = usePdfDocument(entry?.file ?? null);
  const margins = props.workspaceState.cropMargins;

  if (entry === undefined) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <ToolFileCard
        entry={entry}
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

      <section className="flex flex-col gap-4" aria-labelledby="crop-heading">
        <div className="flex flex-col gap-1">
          <h2
            id="crop-heading"
            className="text-base font-semibold tracking-tight text-foreground"
          >
            {t("workspaces.crop.title")}
          </h2>
          <p className="text-sm text-muted-foreground text-pretty">
            {t("workspaces.crop.hint")}
          </p>
        </div>

        {pdf.status === "ready" && pdf.document !== null ? (
          <CropPagePreview
            document={pdf.document}
            margins={margins}
            disabled={props.disabled}
            moveLabel={t("workspaces.crop.move")}
            edgeLabel={(edge) => t(`workspaces.crop.edges.${edge}`)}
            onChange={(next) => {
              props.setWorkspaceState({
                ...props.workspaceState,
                cropMargins: next,
              });
            }}
          />
        ) : (
          <p className="text-sm text-muted-foreground text-pretty">
            {pdf.errorKey === "passwordProtected"
              ? t("workspaces.crop.passwordProtected")
              : t("workspaces.crop.previewHint")}
          </p>
        )}
      </section>

      <p className="text-sm font-medium text-foreground">
        {t("workspaces.crop.output")}
      </p>

      <ToolSelectedActions
        toolRoute={props.tool.route}
        state={props.state}
        canProcess={props.canProcess}
        processLabel={props.processLabel}
        onProcess={props.onProcess}
      />
    </div>
  );
}
