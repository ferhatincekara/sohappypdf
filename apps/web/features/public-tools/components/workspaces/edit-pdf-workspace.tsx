"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import {
  createImageObject,
  DocumentEditor,
  useDocumentEditor,
} from "@/features/pdf-document-editor";
import { ToolFileCard } from "@/features/public-tools/components/tool-file-card";
import { ToolSelectedActions } from "@/features/public-tools/components/tool-selected-actions";
import { editorObjectsToEditOperations } from "@/features/public-tools/lib/edit-pdf-operations";
import { uploadTemporaryAsset } from "@/features/public-tools/lib/upload-temporary-asset";
import { usePdfDocument } from "@/features/public-tools/pdf-workspace";
import type { ToolSelectedWorkspaceProps } from "@/features/public-tools/types/tool-selected-workspace";
import { authClient } from "@/lib/auth/auth-client";

export function EditPdfWorkspace(props: ToolSelectedWorkspaceProps) {
  const t = useTranslations("publicTools");
  const session = authClient.useSession();
  const entry = props.state.files[0];
  const pdf = usePdfDocument(entry?.file ?? null);
  const editor = useDocumentEditor(pdf.pageCount);
  const [pageHeights, setPageHeights] = useState<Record<string, number>>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState(false);
  const workspaceRef = useRef(props.workspaceState);
  const imageFileIdRef = useRef(props.workspaceState.editImageFileId);
  workspaceRef.current = props.workspaceState;
  imageFileIdRef.current = props.workspaceState.editImageFileId;

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
    const operations = editorObjectsToEditOperations(
      editor.state.objects,
      pageHeights,
    );

    props.setWorkspaceState({
      ...workspaceRef.current,
      editImageFileId: imageFileIdRef.current,
      editOperations: operations ?? [],
    });
  }, [editor.state.objects, pageHeights, props.setWorkspaceState]);

  if (entry === undefined) {
    return null;
  }

  async function onAddImage(file: File): Promise<void> {
    setUploadingImage(true);
    setImageError(false);

    try {
      const uploaded = await uploadTemporaryAsset({
        file,
        contentType: file.type || "image/png",
        authenticated: session.data?.user !== undefined,
      });

      imageFileIdRef.current = uploaded.id;
      props.setWorkspaceState({
        ...workspaceRef.current,
        editImageFileId: uploaded.id,
      });

      editor.dispatch({
        type: "addObject",
        object: createImageObject({
          page: editor.state.currentPage,
          x: 72,
          y: 72,
          src: URL.createObjectURL(file),
        }),
      });
    } catch {
      setImageError(true);
    } finally {
      setUploadingImage(false);
    }
  }

  const operationCount = props.workspaceState.editOperations.length;

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
          {t("workspaces.edit.title")}
        </h2>
        <p className="text-sm text-muted-foreground text-pretty">
          {t("workspaces.edit.hint")}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label
          className="text-sm font-medium text-foreground"
          htmlFor="edit-image"
        >
          {t("workspaces.edit.addImage")}
        </label>
        <input
          id="edit-image"
          type="file"
          accept="image/png,image/jpeg"
          disabled={props.disabled || uploadingImage}
          className="max-w-lg text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file !== undefined) {
              void onAddImage(file);
            }
          }}
        />
        {uploadingImage ? (
          <p className="text-sm text-muted-foreground">
            {t("workspaces.edit.uploadingImage")}
          </p>
        ) : null}
        {imageError ? (
          <p className="text-sm text-destructive">
            {t("workspaces.edit.imageFailed")}
          </p>
        ) : null}
      </div>

      <DocumentEditor
        pdf={pdf}
        state={editor.state}
        dispatch={editor.dispatch}
        availableTools={["select", "text", "shape"]}
        disabled={props.disabled}
        previewFailedMessage={t("workspaces.edit.previewFailed")}
        passwordProtectedMessage={t("workspaces.edit.passwordProtected")}
      />

      <p className="text-sm font-medium text-foreground">
        {operationCount === 0
          ? t("workspaces.edit.selectPrompt")
          : t("workspaces.edit.output", { count: operationCount })}
      </p>
      <p className="text-sm text-muted-foreground text-pretty">
        {t("workspaces.edit.limitation")}
      </p>

      <ToolSelectedActions
        toolRoute={props.tool.route}
        state={props.state}
        canProcess={props.canProcess}
        processLabel={props.processLabel}
        disabledReason={
          operationCount === 0 ? t("workspaces.edit.selectPrompt") : null
        }
        onProcess={props.onProcess}
      />
    </div>
  );
}
