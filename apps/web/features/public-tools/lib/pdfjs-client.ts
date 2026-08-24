import {
  GlobalWorkerOptions,
  getDocument,
  type PDFDocumentProxy,
} from "pdfjs-dist";

let workerConfigured = false;

export type PdfjsDocument = PDFDocumentProxy;

export function configurePdfjsWorker(): void {
  if (workerConfigured || typeof window === "undefined") {
    return;
  }

  GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  workerConfigured = true;
}

export function isPdfPasswordError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const haystack = `${error.name} ${error.message}`.toLowerCase();
  return haystack.includes("password");
}

export async function loadPdfDocument(file: File): Promise<PdfjsDocument> {
  configurePdfjsWorker();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const task = getDocument({
    data: bytes,
    disableAutoFetch: true,
    disableStream: true,
  });
  return task.promise;
}
