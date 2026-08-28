"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import {
  createSignatureObject,
  DocumentEditor,
  useDocumentEditor,
} from "@/features/pdf-document-editor";
import { authClient } from "@/lib/auth/auth-client";
import { uploadTemporaryAsset } from "../../lib/upload-temporary-asset";
import { usePdfDocument } from "../../pdf-workspace";
import type { ToolSelectedWorkspaceProps } from "../../types/tool-selected-workspace";
import { ToolFileCard } from "../tool-file-card";
import { ToolSelectedActions } from "../tool-selected-actions";
import { type SignatureAsset, SignaturePad } from "./signature-pad";

export function SignPdfWorkspace(props: ToolSelectedWorkspaceProps) {
  const t = useTranslations("publicTools");
  const session = authClient.useSession();
  const entry = props.state.files[0];
  const pdf = usePdfDocument(entry?.file ?? null);
  const editor = useDocumentEditor(pdf.pageCount);
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const [assetError, setAssetError] = useState(false);
  const placedRef = useRef(false);
  const workspaceRef = useRef(props.workspaceState);
  workspaceRef.current = props.workspaceState;

  useEffect(() => {
    if (pdf.document === null) {
      return;
    }

    let cancelled = false;
    const pageNumber = editor.state.currentPage;

    void pdf.document.getPage(pageNumber).then((page) => {
      if (cancelled) {
        return;
      }

      const viewport = page.getViewport({ scale: 1 });
      props.setWorkspaceState({
        ...workspaceRef.current,
        signPage: pageNumber,
        signPageHeight: viewport.height,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [pdf.document, editor.state.currentPage, props.setWorkspaceState]);

  useEffect(() => {
    const signature = editor.state.objects.find(
      (object) => object.kind === "signature",
    );

    if (signature === undefined) {
      return;
    }

    props.setWorkspaceState({
      ...workspaceRef.current,
      signPage: signature.page,
      signX: signature.x,
      signY: signature.y,
      signWidth: signature.width,
      signHeight: signature.height,
      signText: signature.text ?? workspaceRef.current.signText,
    });
  }, [editor.state.objects, props.setWorkspaceState]);

  if (entry === undefined) {
    return null;
  }

  async function onAsset(asset: SignatureAsset): Promise<void> {
    setUploadingAsset(true);
    setAssetError(false);

    try {
      const uploaded = await uploadTemporaryAsset({
        file: asset.file,
        contentType: asset.file.type || "image/png",
        authenticated: session.data?.user !== undefined,
      });

      props.setWorkspaceState({
        ...workspaceRef.current,
        signFileId: uploaded.id,
        signText: asset.text ?? "",
      });

      if (!placedRef.current) {
        placedRef.current = true;
        editor.dispatch({
          type: "addObject",
          object: createSignatureObject({
            page: editor.state.currentPage,
            x: 72,
            y: 72,
            src: asset.previewUrl,
            text: asset.text,
          }),
        });
      }
    } catch {
      setAssetError(true);
    } finally {
      setUploadingAsset(false);
    }
  }

  const hasSignature =
    props.workspaceState.signFileId.length > 0 ||
    props.workspaceState.signText.trim().length > 0;

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
          {t("workspaces.sign.title")}
        </h2>
        <p className="text-sm text-muted-foreground text-pretty">
          {t("workspaces.sign.hint")}
        </p>
      </div>

      <SignaturePad
        disabled={props.disabled || uploadingAsset}
        onAsset={onAsset}
      />

      {uploadingAsset ? (
        <p className="text-sm text-muted-foreground">
          {t("workspaces.sign.uploading")}
        </p>
      ) : null}
      {assetError ? (
        <p className="text-sm text-destructive">
          {t("workspaces.sign.uploadFailed")}
        </p>
      ) : null}

      {hasSignature ? (
        <DocumentEditor
          pdf={pdf}
          state={editor.state}
          dispatch={editor.dispatch}
          availableTools={["select"]}
          disabled={props.disabled}
          previewFailedMessage={t("workspaces.sign.previewFailed")}
          passwordProtectedMessage={t("workspaces.sign.passwordProtected")}
        />
      ) : null}

      <p className="text-sm font-medium text-foreground">
        {hasSignature
          ? t("workspaces.sign.output")
          : t("workspaces.sign.selectPrompt")}
      </p>

      <ToolSelectedActions
        toolRoute={props.tool.route}
        state={props.state}
        canProcess={props.canProcess}
        processLabel={props.processLabel}
        disabledReason={hasSignature ? null : t("workspaces.sign.selectPrompt")}
        onProcess={props.onProcess}
      />
    </div>
  );
}
