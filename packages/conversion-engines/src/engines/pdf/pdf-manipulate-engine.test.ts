import { describe, expect, test } from "bun:test";
import { readFile, writeFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { DEFAULT_CONVERSION_ENGINE_CONFIG } from "../../engine-config.js";
import { createConversionWorkspace } from "../../workspace/temp-workspace.js";
import { createPdfManipulateEngine } from "./pdf-manipulate-engine.js";

async function writeBlankPdf(path: string): Promise<void> {
  const document = await PDFDocument.create();
  document.addPage([200, 200]);
  await writeFile(path, await document.save());
}

describe("pdf manipulate engine", () => {
  test("merges and splits PDFs without native binaries", async () => {
    const workspace = await createConversionWorkspace(
      "550e8400-e29b-41d4-a716-446655440222",
    );

    try {
      const first = workspace.join("source.pdf");
      const second = workspace.join("additional-0.pdf");
      await writeBlankPdf(first);
      await writeBlankPdf(second);
      const engine = createPdfManipulateEngine(
        DEFAULT_CONVERSION_ENGINE_CONFIG,
      );

      const merged = await engine.convert({
        type: "merge-pdf",
        sourcePath: first,
        outputDirectory: workspace.directory,
        sourceFormat: "pdf",
        targetFormat: "pdf",
        options: {
          type: "merge-pdf",
          additionalFileIds: ["550e8400-e29b-41d4-a716-446655440223"],
        },
        additionalSourcePaths: [second],
      });
      const mergedPdf = await PDFDocument.load(
        await readFile(merged.outputPath),
      );
      expect(mergedPdf.getPageCount()).toBe(2);

      const split = await engine.convert({
        type: "split-pdf",
        sourcePath: merged.outputPath,
        outputDirectory: workspace.directory,
        sourceFormat: "pdf",
        targetFormat: "pdf",
        options: { type: "split-pdf", ranges: [{ start: 1, end: 1 }] },
        additionalSourcePaths: [],
      });
      const splitPdf = await PDFDocument.load(await readFile(split.outputPath));
      expect(splitPdf.getPageCount()).toBe(1);

      const extractSource = workspace.join("extract-source.pdf");
      const extractDocument = await PDFDocument.create();
      extractDocument.addPage([200, 200]);
      extractDocument.addPage([200, 200]);
      await writeFile(extractSource, await extractDocument.save());

      const extracted = await engine.convert({
        type: "extract-pages",
        sourcePath: extractSource,
        outputDirectory: workspace.directory,
        sourceFormat: "pdf",
        targetFormat: "pdf",
        options: {
          type: "extract-pages",
          ranges: [{ start: 2, end: 2 }],
        },
        additionalSourcePaths: [],
      });
      const extractedPdf = await PDFDocument.load(
        await readFile(extracted.outputPath),
      );
      expect(extractedPdf.getPageCount()).toBe(1);
    } finally {
      await workspace.cleanup();
    }
  });

  test("rotates and reorders pages without native binaries", async () => {
    const workspace = await createConversionWorkspace(
      "550e8400-e29b-41d4-a716-446655440223",
    );

    try {
      const source = workspace.join("source.pdf");
      const document = await PDFDocument.create();
      document.addPage([200, 200]);
      document.addPage([200, 200]);
      await writeFile(source, await document.save());

      const engine = createPdfManipulateEngine(
        DEFAULT_CONVERSION_ENGINE_CONFIG,
      );

      const rotated = await engine.convert({
        type: "rotate-pdf",
        sourcePath: source,
        outputDirectory: workspace.directory,
        sourceFormat: "pdf",
        targetFormat: "pdf",
        options: { type: "rotate-pdf", degrees: 180, pages: [1] },
        additionalSourcePaths: [],
      });
      const rotatedPdf = await PDFDocument.load(
        await readFile(rotated.outputPath),
      );
      expect(rotatedPdf.getPage(0)?.getRotation().angle % 360).toBe(180);

      const reordered = await engine.convert({
        type: "reorder-pages",
        sourcePath: source,
        outputDirectory: workspace.directory,
        sourceFormat: "pdf",
        targetFormat: "pdf",
        options: { type: "reorder-pages", order: [2, 1] },
        additionalSourcePaths: [],
      });
      const reorderedPdf = await PDFDocument.load(
        await readFile(reordered.outputPath),
      );
      expect(reorderedPdf.getPageCount()).toBe(2);
    } finally {
      await workspace.cleanup();
    }
  });
});
