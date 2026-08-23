import { describe, expect, test } from "bun:test";
import { readFile, writeFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { DEFAULT_CONVERSION_ENGINE_CONFIG } from "../../engine-config.js";
import { isConversionBinaryAvailable } from "../../native-binary.js";
import { createConversionWorkspace } from "../../workspace/temp-workspace.js";
import { createPdfImageEngine } from "./pdf-image-engine.js";
import { createPdfTextEngine } from "./pdf-text-engine.js";

async function writeTextPdf(path: string): Promise<void> {
  const document = await PDFDocument.create();
  document.addPage([200, 200]);
  await writeFile(path, await document.save());
}

describe("pdf native engines", () => {
  test.skipIf(!isConversionBinaryAvailable("pdftoppm"))(
    "renders a PDF page to PNG when Poppler is installed",
    async () => {
      const workspace = await createConversionWorkspace(
        "550e8400-e29b-41d4-a716-446655440230",
      );

      try {
        const sourcePath = workspace.join("source.pdf");
        await writeTextPdf(sourcePath);
        const result = await createPdfImageEngine(
          DEFAULT_CONVERSION_ENGINE_CONFIG,
        ).convert({
          type: "pdf-to-png",
          sourcePath,
          outputDirectory: workspace.directory,
          sourceFormat: "pdf",
          targetFormat: "png",
          options: { type: "pdf-to-png" },
          additionalSourcePaths: [],
        });

        const output = await readFile(result.outputPath);
        expect(output.subarray(0, 4)).toEqual(
          Uint8Array.from([137, 80, 78, 71]),
        );
      } finally {
        await workspace.cleanup();
      }
    },
  );

  test.skipIf(!isConversionBinaryAvailable("pdftotext"))(
    "extracts text when Poppler is installed",
    async () => {
      const workspace = await createConversionWorkspace(
        "550e8400-e29b-41d4-a716-446655440231",
      );

      try {
        const sourcePath = workspace.join("source.pdf");
        await writeTextPdf(sourcePath);
        const result = await createPdfTextEngine(
          DEFAULT_CONVERSION_ENGINE_CONFIG,
        ).convert({
          type: "pdf-to-txt",
          sourcePath,
          outputDirectory: workspace.directory,
          sourceFormat: "pdf",
          targetFormat: "txt",
          options: { type: "pdf-to-txt" },
          additionalSourcePaths: [],
        });

        expect((await readFile(result.outputPath)).byteLength).toBeGreaterThan(
          0,
        );
      } finally {
        await workspace.cleanup();
      }
    },
  );
});
