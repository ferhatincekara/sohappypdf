"use client";

import { useTranslations } from "next-intl";
import { useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/features/files/lib/format-file-size";
import type { ToolSelectedWorkspaceProps } from "../../types/tool-selected-workspace";
import { ToolFilePreview } from "../tool-file-preview";
import { ToolSelectedActions } from "../tool-selected-actions";
import { ConvertResultSummary } from "./convert-result-summary";

export function ImageToPdfWorkspace(props: ToolSelectedWorkspaceProps) {
  const t = useTranslations("publicTools");
  const entry = props.state.files[0];
  const sourceFormat = props.tool.inputFormats[0] ?? "jpg";
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  if (entry === undefined) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <article className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-start">
        <ToolFilePreview entry={entry} className="size-28 sm:size-36" />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {t("workspaces.imageToPdf.title")}
          </h2>
          <p className="mt-1 truncate text-sm text-foreground">
            {entry.file.name}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatFileSize(entry.file.size)}
          </p>
          <p className="mt-3 text-sm text-muted-foreground text-pretty">
            {t("workspaces.imageToPdf.hint")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              id={inputId}
              ref={inputRef}
              type="file"
              className="sr-only"
              accept={props.accept}
              disabled={props.disabled}
              onChange={(event) => {
                if (
                  event.target.files !== null &&
                  event.target.files.length > 0
                ) {
                  props.onReplaceFiles(event.target.files);
                }
                event.target.value = "";
              }}
            />
            <Button
              type="button"
              size="xs"
              variant="outline"
              disabled={props.disabled}
              onClick={() => {
                inputRef.current?.click();
              }}
            >
              {t("workspace.replaceFile")}
            </Button>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              disabled={props.disabled}
              aria-label={t("workspace.removeFile", { name: entry.file.name })}
              onClick={() => {
                props.onRemove(entry.id);
              }}
            >
              {t("workspace.remove")}
            </Button>
          </div>
        </div>
      </article>

      <ConvertResultSummary sourceFormat={sourceFormat} targetFormat="pdf" />

      <p className="text-sm font-medium text-foreground" aria-live="polite">
        {t("workspaces.imageToPdf.output")}
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
