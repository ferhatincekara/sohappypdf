import type { PDFDocumentProxy } from "pdfjs-dist";

let workerConfigured = false;

export type PdfjsDocument = PDFDocumentProxy;

export function isPdfPasswordError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const haystack = `${error.name} ${error.message}`.toLowerCase();
  return haystack.includes("password");
}

export async function loadPdfDocument(file: File): Promise<PdfjsDocument> {
  if (typeof window === "undefined") {
    throw new Error("PDF preview is only available in the browser");
  }

  const pdfjs = await import("pdfjs-dist");

  if (!workerConfigured) {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    workerConfigured = true;
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const task = pdfjs.getDocument({
    data: bytes,
    disableAutoFetch: true,
    disableStream: true,
  });
  return task.promise;
}
