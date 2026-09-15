import { describe, expect, test } from "bun:test";
import { writeFile } from "node:fs/promises";
import { DEFAULT_CONVERSION_ENGINE_CONFIG } from "../../engine-config.js";
import { isPermanentConversionError } from "../../errors.js";
import type { RunCommandInput } from "../../process/run-process.js";
import { createConversionWorkspace } from "../../workspace/temp-workspace.js";
import { createOcrEngine } from "./ocr-engine.js";

const PDF_BYTES = "%PDF-1.4\n%EOF\n";

describe("ocr engine", () => {
  test("runs ocrmypdf and returns a searchable PDF", async () => {
    const workspace = await createConversionWorkspace(
      "550e8400-e29b-41d4-a716-446655440301",
    );
    const calls: RunCommandInput[] = [];

    try {
      const sourcePath = workspace.join("source.pdf");
      await writeFile(sourcePath, PDF_BYTES);
      const engine = createOcrEngine(DEFAULT_CONVERSION_ENGINE_CONFIG, {
        isBinaryAvailable: () => true,
        async runCommand(input) {
          calls.push(input);
          const outputPath = input.args[input.args.length - 1];
          if (outputPath !== undefined) {
            await writeFile(outputPath, PDF_BYTES);
          }
        },
      });

      const result = await engine.convert({
        type: "ocr-pdf",
        sourcePath,
        outputDirectory: workspace.directory,
        sourceFormat: "pdf",
        targetFormat: "pdf",
        options: { type: "ocr-pdf", language: "tr", outputMode: "pdf" },
        additionalSourcePaths: [],
      });

      expect(calls[0]?.command).toBe("ocrmypdf");
      expect(calls[0]?.args).toContain("--skip-text");
      expect(calls[0]?.args).toContain("tur");
      expect(calls[0]?.acceptExitCodes).toEqual([0, 6]);
      expect(result.filename).toBe("output.pdf");
    } finally {
      await workspace.cleanup();
    }
  });

  test("reuses the source PDF when every page already has text", async () => {
    const workspace = await createConversionWorkspace(
      "550e8400-e29b-41d4-a716-446655440311",
    );

    try {
      const sourcePath = workspace.join("source.pdf");
      await writeFile(sourcePath, PDF_BYTES);
      const engine = createOcrEngine(DEFAULT_CONVERSION_ENGINE_CONFIG, {
        isBinaryAvailable: () => true,
        async runCommand() {
          // OCRmyPDF exit 6 does not write an output file.
        },
      });

      const result = await engine.convert({
        type: "ocr-pdf",
        sourcePath,
        outputDirectory: workspace.directory,
        sourceFormat: "pdf",
        targetFormat: "pdf",
        options: { type: "ocr-pdf", language: "eng", outputMode: "pdf" },
        additionalSourcePaths: [],
      });

      expect(result.filename).toBe("output.pdf");
      expect(await Bun.file(result.outputPath).text()).toBe(PDF_BYTES);
    } finally {
      await workspace.cleanup();
    }
  });

  test("retries with force OCR when skip-text fails", async () => {
    const workspace = await createConversionWorkspace(
      "550e8400-e29b-41d4-a716-446655440312",
    );
    const calls: RunCommandInput[] = [];

    try {
      const sourcePath = workspace.join("source.pdf");
      await writeFile(sourcePath, PDF_BYTES);
      const engine = createOcrEngine(DEFAULT_CONVERSION_ENGINE_CONFIG, {
        isBinaryAvailable: () => true,
        async runCommand(input) {
          calls.push(input);
          if (input.args.includes("--skip-text")) {
            throw new Error("TaggedPDFError");
          }

          const outputPath = input.args[input.args.length - 1];
          if (outputPath !== undefined) {
            await writeFile(outputPath, PDF_BYTES);
          }
        },
      });

      const result = await engine.convert({
        type: "ocr-pdf",
        sourcePath,
        outputDirectory: workspace.directory,
        sourceFormat: "pdf",
        targetFormat: "pdf",
        options: { type: "ocr-pdf", language: "eng", outputMode: "pdf" },
        additionalSourcePaths: [],
      });

      expect(calls).toHaveLength(2);
      expect(calls[0]?.args).toContain("--skip-text");
      expect(calls[1]?.args).toContain("--force-ocr");
      expect(result.filename).toBe("output.pdf");
    } finally {
      await workspace.cleanup();
    }
  });

  test("force-OCRs again when extracted text is empty", async () => {
    const workspace = await createConversionWorkspace(
      "550e8400-e29b-41d4-a716-446655440313",
    );
    const calls: RunCommandInput[] = [];
    let textPasses = 0;

    try {
      const sourcePath = workspace.join("source.pdf");
      await writeFile(sourcePath, PDF_BYTES);
      const engine = createOcrEngine(DEFAULT_CONVERSION_ENGINE_CONFIG, {
        isBinaryAvailable: () => true,
        async runCommand(input) {
          calls.push(input);
          const outputPath = input.args[input.args.length - 1];
          if (outputPath === undefined) {
            return;
          }

          if (input.command === "pdftotext") {
            textPasses += 1;
            await writeFile(outputPath, textPasses === 1 ? "   \n" : "Hello\n");
            return;
          }

          await writeFile(outputPath, PDF_BYTES);
        },
      });

      const result = await engine.convert({
        type: "ocr-pdf",
        sourcePath,
        outputDirectory: workspace.directory,
        sourceFormat: "pdf",
        targetFormat: "txt",
        options: { type: "ocr-pdf", language: "eng", outputMode: "txt" },
        additionalSourcePaths: [],
      });

      expect(calls.some((call) => call.args.includes("--force-ocr"))).toBe(
        true,
      );
      expect(await Bun.file(result.outputPath).text()).toBe("Hello\n");
    } finally {
      await workspace.cleanup();
    }
  });

  test("fails when no text can be recognized", async () => {
    const workspace = await createConversionWorkspace(
      "550e8400-e29b-41d4-a716-446655440314",
    );

    try {
      const sourcePath = workspace.join("source.pdf");
      await writeFile(sourcePath, PDF_BYTES);
      const engine = createOcrEngine(DEFAULT_CONVERSION_ENGINE_CONFIG, {
        isBinaryAvailable: () => true,
        async runCommand(input) {
          const outputPath = input.args[input.args.length - 1];
          if (outputPath === undefined) {
            return;
          }

          if (input.command === "pdftotext") {
            await writeFile(outputPath, "\n");
            return;
          }

          await writeFile(outputPath, PDF_BYTES);
        },
      });

      try {
        await engine.convert({
          type: "ocr-pdf",
          sourcePath,
          outputDirectory: workspace.directory,
          sourceFormat: "pdf",
          targetFormat: "txt",
          options: { type: "ocr-pdf", language: "eng", outputMode: "txt" },
          additionalSourcePaths: [],
        });
        throw new Error("expected empty OCR text to fail");
      } catch (error) {
        expect(isPermanentConversionError(error)).toBe(true);
      }
    } finally {
      await workspace.cleanup();
    }
  });
});
