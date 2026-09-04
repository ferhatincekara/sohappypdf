"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createSignatureObject,
  DocumentEditor,
  useDocumentEditor,
} from "@/features/pdf-document-editor";
import { ToolFileCard } from "@/features/public-tools/components/tool-file-card";
import { ToolSelectedActions } from "@/features/public-tools/components/tool-selected-actions";
import {
  type SignatureAsset,
  SignaturePad,
} from "@/features/public-tools/components/workspaces/signature-pad";
import { uploadTemporaryAsset } from "@/features/public-tools/lib/upload-temporary-asset";
import { usePdfDocument } from "@/features/public-tools/pdf-workspace";
import type { ToolSelectedWorkspaceProps } from "@/features/public-tools/types/tool-selected-workspace";
import { authClient } from "@/lib/auth/auth-client";

export function SignPdfWorkspace(props: ToolSelectedWorkspaceProps) {
  const t = useTranslations("publicTools");
  const session = authClient.useSession();
  const entry = props.state.files[0];
  const pdf = usePdfDocument(entry?.file ?? null);
  const editor = useDocumentEditor(pdf.pageCount);
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const [assetError, setAssetError] = useState(false);
  const [editorOpen, setEditorOpen] = useState(true);
  const [padOpen, setPadOpen] = useState(false);
  const workspaceRef = useRef(props.workspaceState);
  workspaceRef.current = props.workspaceState;

  const signature = editor.state.objects.find(
    (object) => object.kind === "signature",
  );

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
    if (signature === undefined) {
      if (workspaceRef.current.signFileId.length === 0) {
        return;
      }

      props.setWorkspaceState({
        ...workspaceRef.current,
        signFileId: "",
        signText: "",
      });
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
  }, [signature, props.setWorkspaceState]);

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

      const current = editor.state.objects.find(
        (object) => object.kind === "signature",
      );

      if (current === undefined) {
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
      } else {
        editor.dispatch({
          type: "updateObject",
          id: current.id,
          object: {
            ...current,
            src: asset.previewUrl,
            text: asset.text,
          },
        });
      }

      setPadOpen(false);
    } catch {
      setAssetError(true);
    } finally {
      setUploadingAsset(false);
    }
  }

  const hasSignature = signature !== undefined;

  const pad = (
    <SignaturePad
      disabled={props.disabled || uploadingAsset}
      onAsset={onAsset}
    />
  );

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

      {hasSignature && editorOpen ? null : pad}

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

      {hasSignature && editorOpen && pdf.status === "ready" ? (
        <DocumentEditor
          pdf={pdf}
          state={editor.state}
          dispatch={editor.dispatch}
          availableTools={["select"]}
          disabled={props.disabled}
          layout="workspace"
          title={entry.file.name}
          propertiesExtra={
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={props.disabled || uploadingAsset}
              onClick={() => {
                setPadOpen(true);
              }}
            >
              {t("workspaces.sign.changeSignature")}
            </Button>
          }
          previewFailedMessage={t("workspaces.sign.previewFailed")}
          passwordProtectedMessage={t("workspaces.sign.passwordProtected")}
          exportLabel={props.processLabel}
          exportDisabled={!props.canProcess}
          onBack={() => {
            setEditorOpen(false);
          }}
          onExport={props.onProcess}
        />
      ) : hasSignature ? (
        <button
          type="button"
          className="rounded-lg border border-border px-4 py-3 text-left text-sm font-medium text-foreground"
          onClick={() => {
            setEditorOpen(true);
          }}
        >
          {t("workspaces.sign.openEditor")}
        </button>
      ) : null}

      <Dialog open={padOpen} onOpenChange={setPadOpen}>
        <DialogContent
          closeLabel={t("workspaces.sign.closePad")}
          className="max-w-lg"
        >
          <DialogHeader>
            <DialogTitle>
              {signature === undefined
                ? t("workspaces.sign.addSignature")
                : t("workspaces.sign.changeSignature")}
            </DialogTitle>
            <DialogDescription>{t("workspaces.sign.hint")}</DialogDescription>
          </DialogHeader>
          {pad}
        </DialogContent>
      </Dialog>

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
