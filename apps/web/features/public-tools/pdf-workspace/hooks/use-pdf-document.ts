"use client";

import { useEffect, useState } from "react";
import type { PdfjsDocument } from "@/features/public-tools/lib/pdfjs-client";

export type PdfDocumentStatus = "idle" | "loading" | "ready" | "error";

export type PdfPreviewErrorKey = "passwordProtected" | "previewFailed";

export type PdfDocumentState = {
  status: PdfDocumentStatus;
  pageCount: number;
  document: PdfjsDocument | null;
  errorKey: PdfPreviewErrorKey | null;
};

const IDLE_STATE: PdfDocumentState = {
  status: "idle",
  pageCount: 0,
  document: null,
  errorKey: null,
};

export function usePdfDocument(file: File | null): PdfDocumentState {
  const [state, setState] = useState<PdfDocumentState>(IDLE_STATE);

  useEffect(() => {
    if (file === null) {
      setState(IDLE_STATE);
      return;
    }

    let cancelled = false;
    let loaded: PdfjsDocument | null = null;
    setState({
      status: "loading",
      pageCount: 0,
      document: null,
      errorKey: null,
    });

    void (async () => {
      const { isPdfPasswordError, loadPdfDocument } = await import(
        "@/features/public-tools/lib/pdfjs-client"
      );

      try {
        const document = await loadPdfDocument(file);
        loaded = document;

        if (cancelled) {
          void document.destroy();
          return;
        }

        setState({
          status: "ready",
          pageCount: document.numPages,
          document,
          errorKey: null,
        });
      } catch (error: unknown) {
        if (cancelled) {
          return;
        }

        setState({
          status: "error",
          pageCount: 0,
          document: null,
          errorKey: isPdfPasswordError(error)
            ? "passwordProtected"
            : "previewFailed",
        });
      }
    })();

    return () => {
      cancelled = true;
      if (loaded !== null) {
        void loaded.destroy();
      }
    };
  }, [file]);

  return state;
}
