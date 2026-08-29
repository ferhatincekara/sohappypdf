"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToolSelectedActions } from "@/features/public-tools/components/tool-selected-actions";
import { ToolWorkspaceFiles } from "@/features/public-tools/components/tool-workspace-files";
import type { ToolSelectedWorkspaceProps } from "@/features/public-tools/types/tool-selected-workspace";
import { cn } from "@/lib/utils";

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
      <ToolWorkspaceFiles props={props} />

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
          <Select
            value={language}
            disabled={props.disabled}
            items={OCR_LANGUAGES.map((code) => ({
              value: code,
              label: t(`options.languages.${code}`),
            }))}
            onValueChange={(value) => {
              if (value === null) {
                return;
              }

              props.setWorkspaceState({
                ...props.workspaceState,
                targetLanguage: value,
              });
            }}
          >
            <SelectTrigger id="ocr-language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OCR_LANGUAGES.map((code) => (
                <SelectItem key={code} value={code}>
                  {t(`options.languages.${code}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col divide-y divide-border">
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
                  "flex flex-col items-start gap-1 py-4 text-left outline-none transition-opacity",
                  selected ? "opacity-100" : "opacity-55 hover:opacity-100",
                )}
              >
                <p className="text-sm font-semibold text-foreground">
                  {t(`workspaces.ocr.modes.${mode}.title`)}
                </p>
                <p className="text-sm text-muted-foreground text-pretty">
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
        awaitingSignIn={props.awaitingSignIn === true}
        onProcess={props.onProcess}
      />
    </div>
  );
}
