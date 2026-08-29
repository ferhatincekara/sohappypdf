"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToolSelectedActions } from "@/features/public-tools/components/tool-selected-actions";
import { ToolWorkspaceFiles } from "@/features/public-tools/components/tool-workspace-files";
import {
  createPdfPages,
  PdfPageThumbnail,
  usePdfDocument,
} from "@/features/public-tools/pdf-workspace";
import type { ToolSelectedWorkspaceProps } from "@/features/public-tools/types/tool-selected-workspace";

const MIN_OPACITY = 0.05;
const MAX_OPACITY = 1;
const MAX_TEXT_LENGTH = 200;

export function WatermarkPdfWorkspace(props: ToolSelectedWorkspaceProps) {
  const t = useTranslations("publicTools");
  const entry = props.state.files[0];
  const pdf = usePdfDocument(entry?.file ?? null);
  const text = props.workspaceState.watermarkText;
  const opacity = props.workspaceState.watermarkOpacity;
  const previewPage = createPdfPages(1, [])[0];
  const disabledReason =
    text.trim().length === 0
      ? t("workspaces.watermark.required")
      : text.trim().length > MAX_TEXT_LENGTH
        ? t("workspaces.watermark.tooLong")
        : null;

  if (entry === undefined) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <ToolWorkspaceFiles props={props} />

      <section
        className="flex flex-col gap-4"
        aria-labelledby="watermark-heading"
      >
        <div className="flex flex-col gap-1">
          <h2
            id="watermark-heading"
            className="text-base font-semibold tracking-tight text-foreground"
          >
            {t("workspaces.watermark.title")}
          </h2>
          <p className="text-sm text-muted-foreground text-pretty">
            {t("workspaces.watermark.hint")}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,--spacing(64))_minmax(0,1fr)]">
          {pdf.status === "ready" &&
          pdf.document !== null &&
          previewPage !== undefined ? (
            <div className="mx-auto w-full max-w-64">
              <PdfPageThumbnail
                document={pdf.document}
                pageId={previewPage.id}
                pageNumber={previewPage.pageNumber}
                selected={false}
                disabled={props.disabled}
                interactive={false}
                overlay={
                  <span
                    className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4"
                    aria-hidden="true"
                  >
                    <span
                      className="max-w-full truncate text-center text-lg font-semibold tracking-wide text-neutral-500 uppercase"
                      style={{
                        opacity,
                        transform: "rotate(-45deg)",
                      }}
                    >
                      {text.trim().length === 0
                        ? t("workspaces.watermark.previewEmpty")
                        : text.trim()}
                    </span>
                  </span>
                }
              />
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {t("workspaces.watermark.previewCaption")}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-pretty">
              {pdf.errorKey === "passwordProtected"
                ? t("workspaces.watermark.passwordProtected")
                : t("workspaces.watermark.previewHint")}
            </p>
          )}

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="watermark-text">
                {t("workspaces.watermark.text")}
              </Label>
              <Input
                id="watermark-text"
                value={text}
                maxLength={MAX_TEXT_LENGTH}
                disabled={props.disabled}
                onChange={(event) => {
                  props.setWorkspaceState({
                    ...props.workspaceState,
                    watermarkText: event.target.value,
                  });
                }}
              />
            </div>

            <details className="border-t border-border pt-4">
              <summary className="cursor-pointer text-sm font-medium text-foreground outline-none">
                {t("workspaces.watermark.more")}
              </summary>
              <div className="mt-4 flex flex-col gap-2">
                <Label htmlFor="watermark-opacity">
                  {t("workspaces.watermark.opacity", {
                    percent: Math.round(opacity * 100),
                  })}
                </Label>
                <input
                  id="watermark-opacity"
                  type="range"
                  min={MIN_OPACITY}
                  max={MAX_OPACITY}
                  step={0.05}
                  value={opacity}
                  disabled={props.disabled}
                  className="w-full accent-foreground"
                  onChange={(event) => {
                    props.setWorkspaceState({
                      ...props.workspaceState,
                      watermarkOpacity: Number(event.target.value),
                    });
                  }}
                />
                <p className="text-xs text-muted-foreground text-pretty">
                  {t("workspaces.watermark.opacityHint")}
                </p>
              </div>
            </details>
          </div>
        </div>
      </section>

      <p className="text-sm font-medium text-foreground">
        {t("workspaces.watermark.output")}
      </p>

      <ToolSelectedActions
        toolRoute={props.tool.route}
        state={props.state}
        canProcess={props.canProcess}
        processLabel={props.processLabel}
        disabledReason={disabledReason}
        onProcess={props.onProcess}
      />
    </div>
  );
}
