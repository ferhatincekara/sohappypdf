"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import {
  DocumentEditor,
  useDocumentEditor,
} from "@/features/pdf-document-editor";
import { ToolFileCard } from "@/features/public-tools/components/tool-file-card";
import { ToolSelectedActions } from "@/features/public-tools/components/tool-selected-actions";
import { editorObjectsToRedactRegions } from "@/features/public-tools/lib/redact-regions";
import { usePdfDocument } from "@/features/public-tools/pdf-workspace";
import type { ToolSelectedWorkspaceProps } from "@/features/public-tools/types/tool-selected-workspace";

export function RedactPdfWorkspace(props: ToolSelectedWorkspaceProps) {
  const t = useTranslations("publicTools");
  const entry = props.state.files[0];
  const pdf = usePdfDocument(entry?.file ?? null);
  const editor = useDocumentEditor(pdf.pageCount);
  const [pageHeights, setPageHeights] = useState<Record<string, number>>({});
  const [editorOpen, setEditorOpen] = useState(true);
  const workspaceRef = useRef(props.workspaceState);
  workspaceRef.current = props.workspaceState;

  useEffect(() => {
    if (pdf.document === null) {
      return;
    }

    let cancelled = false;
    const loaded = pdf.document;

    void (async () => {
      const heights: Record<string, number> = {};
      for (let page = 1; page <= loaded.numPages; page += 1) {
        const pdfPage = await loaded.getPage(page);
        heights[String(page)] = pdfPage.getViewport({ scale: 1 }).height;
      }

      if (!cancelled) {
        setPageHeights(heights);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pdf.document]);

  useEffect(() => {
    const regions = editorObjectsToRedactRegions(
      editor.state.objects,
      pageHeights,
    );

    props.setWorkspaceState({
      ...workspaceRef.current,
      redactRegions: regions ?? [],
    });
  }, [editor.state.objects, pageHeights, props.setWorkspaceState]);

  if (entry === undefined) {
    return null;
  }

  const regionCount = props.workspaceState.redactRegions.length;

  return (
    <div className="flex flex-col gap-6">
      <ToolFileCard
        entry={entry}
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

      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          {t("workspaces.redact.title")}
        </h2>
        <p className="text-sm text-muted-foreground text-pretty">
          {t("workspaces.redact.hint")}
        </p>
      </div>

      {editorOpen && pdf.status === "ready" ? (
        <DocumentEditor
          pdf={pdf}
          state={editor.state}
          dispatch={editor.dispatch}
          availableTools={["select", "shape"]}
          disabled={props.disabled}
          layout="workspace"
          rectangleStyle="fill"
          title={entry.file.name}
          previewFailedMessage={t("workspaces.redact.previewFailed")}
          passwordProtectedMessage={t("workspaces.redact.passwordProtected")}
          exportLabel={props.processLabel}
          exportDisabled={!props.canProcess || regionCount === 0}
          onBack={() => {
            setEditorOpen(false);
          }}
          onExport={props.onProcess}
        />
      ) : (
        <button
          type="button"
          className="rounded-lg border border-border px-4 py-3 text-left text-sm font-medium text-foreground"
          onClick={() => {
            setEditorOpen(true);
            editor.dispatch({ type: "setTool", tool: "shape" });
          }}
        >
          {t("workspaces.redact.openEditor")}
        </button>
      )}

      <p className="text-sm font-medium text-foreground">
        {regionCount === 0
          ? t("workspaces.redact.selectPrompt")
          : t("workspaces.redact.output", { count: regionCount })}
      </p>
      <p className="text-sm text-muted-foreground text-pretty">
        {t("workspaces.redact.limitation")}
      </p>

      <ToolSelectedActions
        toolRoute={props.tool.route}
        state={props.state}
        canProcess={props.canProcess}
        processLabel={props.processLabel}
        disabledReason={
          regionCount === 0 ? t("workspaces.redact.selectPrompt") : null
        }
        onProcess={props.onProcess}
      />
    </div>
  );
}
