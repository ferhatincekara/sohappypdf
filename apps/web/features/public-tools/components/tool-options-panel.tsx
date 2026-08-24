"use client";

import type { ToolDefinition } from "@repo/tools/catalog";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ToolWorkspaceState } from "../lib/tool-workspace";

export function toolHasWorkspaceOptions(toolId: string): boolean {
  switch (toolId) {
    case "compress-pdf":
    case "rotate-pdf":
    case "split-pdf":
    case "organize-pdf":
    case "reorder-pages":
    case "remove-pages":
    case "crop-pdf":
    case "watermark-pdf":
    case "page-numbers-pdf":
    case "protect-pdf":
    case "unlock-pdf":
    case "ai-summarizer":
    case "translate-pdf":
      return true;
    default:
      return false;
  }
}

export function ToolOptionsPanel({
  tool,
  state,
  onChange,
  disabled,
}: {
  tool: ToolDefinition;
  state: ToolWorkspaceState;
  onChange: (next: ToolWorkspaceState) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("publicTools.options");

  switch (tool.id) {
    case "compress-pdf":
      return (
        <div className="flex flex-col gap-2">
          <Label htmlFor="compression-level">{t("compressionLevel")}</Label>
          <select
            id="compression-level"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={state.compressionLevel}
            disabled={disabled}
            onChange={(event) => {
              onChange({
                ...state,
                compressionLevel: event.target
                  .value as ToolWorkspaceState["compressionLevel"],
              });
            }}
          >
            <option value="low">{t("compressionLow")}</option>
            <option value="medium">{t("compressionMedium")}</option>
            <option value="high">{t("compressionHigh")}</option>
          </select>
        </div>
      );
    case "rotate-pdf":
      return (
        <div className="flex flex-col gap-2">
          <Label htmlFor="rotation">{t("rotation")}</Label>
          <select
            id="rotation"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={state.rotationDegrees}
            disabled={disabled}
            onChange={(event) => {
              onChange({
                ...state,
                rotationDegrees: Number(
                  event.target.value,
                ) as ToolWorkspaceState["rotationDegrees"],
              });
            }}
          >
            <option value={90}>90°</option>
            <option value={180}>180°</option>
            <option value={270}>270°</option>
          </select>
        </div>
      );
    case "split-pdf":
      return (
        <div className="flex flex-col gap-2">
          <Label htmlFor="split-ranges">{t("splitRanges")}</Label>
          <Input
            id="split-ranges"
            placeholder={t("splitRangesPlaceholder")}
            value={state.splitRanges}
            disabled={disabled}
            onChange={(event) => {
              onChange({ ...state, splitRanges: event.target.value });
            }}
          />
        </div>
      );
    case "organize-pdf":
    case "reorder-pages":
      return (
        <div className="flex flex-col gap-2">
          <Label htmlFor="page-order">{t("pageOrder")}</Label>
          <Input
            id="page-order"
            placeholder={t("pageOrderPlaceholder")}
            value={state.pageOrder}
            disabled={disabled}
            onChange={(event) => {
              onChange({ ...state, pageOrder: event.target.value });
            }}
          />
        </div>
      );
    case "remove-pages":
      return (
        <div className="flex flex-col gap-2">
          <Label htmlFor="remove-pages">{t("pagesToRemove")}</Label>
          <Input
            id="remove-pages"
            placeholder={t("pagesToRemovePlaceholder")}
            value={state.pagesToRemove}
            disabled={disabled}
            onChange={(event) => {
              onChange({ ...state, pagesToRemove: event.target.value });
            }}
          />
        </div>
      );
    case "crop-pdf":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {(["top", "right", "bottom", "left"] as const).map((side) => (
            <div key={side} className="flex flex-col gap-2">
              <Label htmlFor={`crop-${side}`}>
                {t(
                  side === "top"
                    ? "cropTop"
                    : side === "right"
                      ? "cropRight"
                      : side === "bottom"
                        ? "cropBottom"
                        : "cropLeft",
                )}
              </Label>
              <Input
                id={`crop-${side}`}
                type="number"
                min={0}
                value={state.cropMargins[side]}
                disabled={disabled}
                onChange={(event) => {
                  onChange({
                    ...state,
                    cropMargins: {
                      ...state.cropMargins,
                      [side]: Number(event.target.value),
                    },
                  });
                }}
              />
            </div>
          ))}
        </div>
      );
    case "watermark-pdf":
      return (
        <div className="flex flex-col gap-2">
          <Label htmlFor="watermark">{t("watermarkText")}</Label>
          <Input
            id="watermark"
            value={state.watermarkText}
            disabled={disabled}
            onChange={(event) => {
              onChange({ ...state, watermarkText: event.target.value });
            }}
          />
        </div>
      );
    case "page-numbers-pdf":
      return (
        <div className="flex flex-col gap-2">
          <Label htmlFor="page-start">{t("pageNumberStart")}</Label>
          <Input
            id="page-start"
            type="number"
            min={1}
            value={state.pageNumberStart}
            disabled={disabled}
            onChange={(event) => {
              onChange({
                ...state,
                pageNumberStart: Number(event.target.value),
              });
            }}
          />
        </div>
      );
    case "protect-pdf":
    case "unlock-pdf":
      return (
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">{t("password")}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={state.password}
            disabled={disabled}
            onChange={(event) => {
              onChange({ ...state, password: event.target.value });
            }}
          />
        </div>
      );
    case "ai-summarizer":
      return (
        <div className="flex flex-col gap-2">
          <Label htmlFor="output-format">{t("outputFormat")}</Label>
          <select
            id="output-format"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={state.outputFormat === "" ? "txt" : state.outputFormat}
            disabled={disabled}
            onChange={(event) => {
              onChange({ ...state, outputFormat: event.target.value });
            }}
          >
            <option value="txt">TXT</option>
            <option value="md">Markdown</option>
          </select>
        </div>
      );
    case "translate-pdf":
      return (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="target-language">{t("targetLanguage")}</Label>
            <select
              id="target-language"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={state.targetLanguage}
              disabled={disabled}
              onChange={(event) => {
                onChange({ ...state, targetLanguage: event.target.value });
              }}
            >
              <option value="eng">{t("languages.eng")}</option>
              <option value="tur">{t("languages.tur")}</option>
              <option value="deu">{t("languages.deu")}</option>
              <option value="fra">{t("languages.fra")}</option>
              <option value="spa">{t("languages.spa")}</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="translate-output-format">{t("outputFormat")}</Label>
            <select
              id="translate-output-format"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={state.outputFormat === "" ? "pdf" : state.outputFormat}
              disabled={disabled}
              onChange={(event) => {
                onChange({ ...state, outputFormat: event.target.value });
              }}
            >
              <option value="pdf">PDF</option>
              <option value="txt">TXT</option>
            </select>
          </div>
        </div>
      );
    default:
      return null;
  }
}
