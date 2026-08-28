import { readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";

export async function countPdfPagesFromPath(path: string): Promise<number> {
  const bytes = await readFile(path);
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return pdf.getPageCount();
}
