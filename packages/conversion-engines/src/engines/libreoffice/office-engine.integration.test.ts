import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { DEFAULT_CONVERSION_ENGINE_CONFIG } from "../../engine-config.js";
import { isConversionBinaryAvailable } from "../../native-binary.js";
import { createConversionWorkspace } from "../../workspace/temp-workspace.js";
import { createOfficeEngine } from "./office-engine.js";

const nativeAvailable =
  isConversionBinaryAvailable("soffice") &&
  isConversionBinaryAvailable("pdftotext");

async function writeSamplePdf(path: string): Promise<void> {
  const document = await PDFDocument.create();
  const page = document.addPage([612, 792]);
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);

  page.drawText("Recovery Kit", {
    x: 214,
    y: 620,
    size: 28,
    font: bold,
  });
  page.drawText("If you do not have access to the original device", {
    x: 86,
    y: 560,
    size: 12,
    font: regular,
  });
  page.drawText("1  Launch the app on your new device", {
    x: 110,
    y: 520,
    size: 12,
    font: regular,
  });
  page.drawText("alpha", { x: 110, y: 360, size: 10, font: regular });
  page.drawText("bravo", { x: 220, y: 360, size: 10, font: regular });
  page.drawText("charlie", { x: 330, y: 360, size: 10, font: regular });
  page.drawText("delta", { x: 440, y: 360, size: 10, font: regular });

  await writeFile(path, await document.save());
}

function extractDocxText(docxPath: string): string {
  const result = spawnSync("unzip", ["-p", docxPath, "word/document.xml"], {
    encoding: "utf8",
  });

  return result.stdout
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

describe("office engine native", () => {
  test.skipIf(!nativeAvailable)(
    "writes a flowing DOCX without LibreOffice PDF text boxes",
    async () => {
      const workspace = await createConversionWorkspace(
        "550e8400-e29b-41d4-a716-446655440221",
      );

      try {
        const sourcePath = workspace.join("source.pdf");
        await writeSamplePdf(sourcePath);

        const result = await createOfficeEngine(
          DEFAULT_CONVERSION_ENGINE_CONFIG,
        ).convert({
          type: "pdf-to-word",
          sourcePath,
          outputDirectory: workspace.directory,
          sourceFormat: "pdf",
          targetFormat: "docx",
          options: { type: "pdf-to-word" },
          additionalSourcePaths: [],
        });

        const output = await readFile(result.outputPath);
        const text = extractDocxText(result.outputPath);

        expect(result.filename).toBe("output.docx");
        expect(output.subarray(0, 2)).toEqual(Uint8Array.from([80, 75]));
        expect(text).toContain("Recovery Kit");
        expect(text).toContain("Launch the app");
        expect(text).not.toMatch(/\d{12,}/);
        expect(text).not.toContain("Recovery Kit Recovery Kit");
      } finally {
        await workspace.cleanup();
      }
    },
  );

  test.skipIf(!nativeAvailable)(
    "writes an XLSX workbook from extracted PDF text",
    async () => {
      const workspace = await createConversionWorkspace(
        "550e8400-e29b-41d4-a716-446655440234",
      );

      try {
        const sourcePath = workspace.join("source.pdf");
        await writeSamplePdf(sourcePath);

        const result = await createOfficeEngine(
          DEFAULT_CONVERSION_ENGINE_CONFIG,
        ).convert({
          type: "pdf-to-excel",
          sourcePath,
          outputDirectory: workspace.directory,
          sourceFormat: "pdf",
          targetFormat: "xlsx",
          options: { type: "pdf-to-excel" },
          additionalSourcePaths: [],
        });

        const output = await readFile(result.outputPath);

        expect(result.filename).toBe("output.xlsx");
        expect(output.subarray(0, 2)).toEqual(Uint8Array.from([80, 75]));
        expect(output.byteLength).toBeGreaterThan(100);
      } finally {
        await workspace.cleanup();
      }
    },
  );
});
