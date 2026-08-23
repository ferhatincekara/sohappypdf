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
    } finally {
      await workspace.cleanup();
    }
  });
});
