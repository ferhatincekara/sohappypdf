import { describe, expect, test } from "bun:test";
import { copyFile, writeFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { DEFAULT_CONVERSION_ENGINE_CONFIG } from "../../engine-config.js";
import type { RunAllowedCommand } from "../../process/run-process.js";
import { createConversionWorkspace } from "../../workspace/temp-workspace.js";
import { createPdfRepairEngine } from "./pdf-repair-engine.js";

async function writeBlankPdf(path: string): Promise<void> {
  const document = await PDFDocument.create();
  document.addPage([200, 200]);
  await writeFile(path, await document.save());
}

const mockRunCommand: RunAllowedCommand = async (input) => {
  const outputArg = input.args.find((arg) => arg.startsWith("-sOutputFile="));

  if (outputArg === undefined) {
    throw new Error("missing output path");
  }

  const outputPath = outputArg.slice("-sOutputFile=".length);
  const sourcePath = input.args.at(-1);

  if (typeof sourcePath !== "string") {
    throw new Error("missing source path");
  }

  await copyFile(sourcePath, outputPath);
};

describe("pdf repair engine", () => {
  test("rewrites PDFs through ghostscript", async () => {
    const workspace = await createConversionWorkspace(
      "550e8400-e29b-41d4-a716-446655440601",
    );

    try {
      const source = workspace.join("source.pdf");
      await writeBlankPdf(source);
      const engine = createPdfRepairEngine(DEFAULT_CONVERSION_ENGINE_CONFIG, {
        runCommand: mockRunCommand,
      });

      const repaired = await engine.convert({
        type: "repair-pdf",
        sourcePath: source,
        outputDirectory: workspace.directory,
        sourceFormat: "pdf",
        targetFormat: "pdf",
        options: { type: "repair-pdf" },
        additionalSourcePaths: [],
      });

      expect(repaired.mimeType).toBe("application/pdf");
    } finally {
      await workspace.cleanup();
    }
  });
});
