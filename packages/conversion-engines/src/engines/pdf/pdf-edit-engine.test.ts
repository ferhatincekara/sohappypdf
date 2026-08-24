import { describe, expect, test } from "bun:test";
import { readFile, writeFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { DEFAULT_CONVERSION_ENGINE_CONFIG } from "../../engine-config.js";
import { createConversionWorkspace } from "../../workspace/temp-workspace.js";
import { createPdfEditEngine } from "./pdf-edit-engine.js";

async function writeBlankPdf(path: string): Promise<void> {
  const document = await PDFDocument.create();
  document.addPage([300, 400]);
  await writeFile(path, await document.save());
}

describe("pdf edit engine", () => {
  test("adds watermarks and page numbers", async () => {
    const workspace = await createConversionWorkspace(
      "550e8400-e29b-41d4-a716-446655440401",
    );

    try {
      const source = workspace.join("source.pdf");
      await writeBlankPdf(source);
      const engine = createPdfEditEngine(DEFAULT_CONVERSION_ENGINE_CONFIG);

      const watermarked = await engine.convert({
        type: "watermark-pdf",
        sourcePath: source,
        outputDirectory: workspace.directory,
        sourceFormat: "pdf",
        targetFormat: "pdf",
        options: {
          type: "watermark-pdf",
          text: "DRAFT",
          opacity: 0.5,
        },
        additionalSourcePaths: [],
      });
      expect(
        (await readFile(watermarked.outputPath)).byteLength,
      ).toBeGreaterThan(0);

      const numbered = await engine.convert({
        type: "page-numbers-pdf",
        sourcePath: source,
        outputDirectory: workspace.directory,
        sourceFormat: "pdf",
        targetFormat: "pdf",
        options: {
          type: "page-numbers-pdf",
          startAt: 5,
        },
        additionalSourcePaths: [],
      });
      expect((await readFile(numbered.outputPath)).byteLength).toBeGreaterThan(
        0,
      );
    } finally {
      await workspace.cleanup();
    }
  });
});
