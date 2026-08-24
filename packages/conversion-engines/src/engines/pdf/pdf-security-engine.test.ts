import { describe, expect, test } from "bun:test";
import { copyFile, writeFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { DEFAULT_CONVERSION_ENGINE_CONFIG } from "../../engine-config.js";
import type { RunAllowedCommand } from "../../process/run-process.js";
import { createConversionWorkspace } from "../../workspace/temp-workspace.js";
import { createPdfSecurityEngine } from "./pdf-security-engine.js";

async function writeBlankPdf(path: string): Promise<void> {
  const document = await PDFDocument.create();
  document.addPage([200, 200]);
  await writeFile(path, await document.save());
}

const mockRunCommand: RunAllowedCommand = async (input) => {
  const outputPath = input.args.at(-1);

  if (typeof outputPath !== "string") {
    throw new Error("missing output path");
  }

  const sourcePath = input.args.at(-2);

  if (typeof sourcePath !== "string") {
    throw new Error("missing source path");
  }

  await copyFile(sourcePath, outputPath);
};

describe("pdf security engine", () => {
  test("protects and unlocks PDFs through qpdf commands", async () => {
    const workspace = await createConversionWorkspace(
      "550e8400-e29b-41d4-a716-446655440501",
    );

    try {
      const source = workspace.join("source.pdf");
      await writeBlankPdf(source);
      const engine = createPdfSecurityEngine(DEFAULT_CONVERSION_ENGINE_CONFIG, {
        runCommand: mockRunCommand,
      });

      const protectedPdf = await engine.convert({
        type: "protect-pdf",
        sourcePath: source,
        outputDirectory: workspace.directory,
        sourceFormat: "pdf",
        targetFormat: "pdf",
        options: {
          type: "protect-pdf",
          password: "secret",
        },
        additionalSourcePaths: [],
      });

      const unlocked = await engine.convert({
        type: "unlock-pdf",
        sourcePath: protectedPdf.outputPath,
        outputDirectory: workspace.directory,
        sourceFormat: "pdf",
        targetFormat: "pdf",
        options: {
          type: "unlock-pdf",
          password: "secret",
        },
        additionalSourcePaths: [],
      });

      expect(unlocked.filename).toBe("output.pdf");
    } finally {
      await workspace.cleanup();
    }
  });
});
