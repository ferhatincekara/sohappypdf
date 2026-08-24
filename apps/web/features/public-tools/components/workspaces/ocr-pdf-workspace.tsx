"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ToolSelectedWorkspaceProps } from "../../types/tool-selected-workspace";
import { ToolFileCard } from "../tool-file-card";
import { ToolSelectedActions } from "../tool-selected-actions";

const OCR_LANGUAGES = ["eng", "tur", "deu", "fra", "spa"] as const;
const OCR_OUTPUTS = ["pdf", "txt"] as const;

type OcrOutput = (typeof OCR_OUTPUTS)[number];

function resolveOcrOutput(value: string): OcrOutput {
  return value === "txt" ? "txt" : "pdf";
}

export function OcrPdfWorkspace(props: ToolSelectedWorkspaceProps) {
  const t = useTranslations("publicTools");
  const entry = props.state.files[0];
  const output = resolveOcrOutput(props.workspaceState.outputFormat);
  const language = props.workspaceState.targetLanguage;

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

      <section className="flex flex-col gap-3" aria-labelledby="ocr-heading">
        <div className="flex flex-col gap-1">
          <h2
            id="ocr-heading"
            className="text-base font-semibold tracking-tight text-foreground"
          >
            {t("workspaces.ocr.title")}
          </h2>
          <p className="text-sm text-muted-foreground text-pretty">
            {t("workspaces.ocr.hint")}
          </p>
        </div>

        <div className="flex max-w-sm flex-col gap-2">
          <Label htmlFor="ocr-language">{t("workspaces.ocr.language")}</Label>
          <select
            id="ocr-language"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            value={language}
            disabled={props.disabled}
            onChange={(event) => {
              props.setWorkspaceState({
                ...props.workspaceState,
                targetLanguage: event.target.value,
              });
            }}
          >
            {OCR_LANGUAGES.map((code) => (
              <option key={code} value={code}>
                {t(`options.languages.${code}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {OCR_OUTPUTS.map((mode) => {
            const selected = output === mode;

            return (
              <button
                key={mode}
                type="button"
                disabled={props.disabled}
                aria-pressed={selected}
                onClick={() => {
                  props.setWorkspaceState({
                    ...props.workspaceState,
                    outputFormat: mode,
                  });
                }}
                className={cn(
                  "rounded-xl border p-4 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                  selected
                    ? "border-foreground bg-card shadow-xs"
                    : "border-border bg-card/60 hover:bg-muted/40",
                )}
              >
                <p className="text-sm font-medium text-foreground">
                  {t(`workspaces.ocr.modes.${mode}.title`)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground text-pretty">
                  {t(`workspaces.ocr.modes.${mode}.hint`)}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <p className="text-sm font-medium text-foreground" aria-live="polite">
        {t(`workspaces.ocr.output.${output}`)}
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
