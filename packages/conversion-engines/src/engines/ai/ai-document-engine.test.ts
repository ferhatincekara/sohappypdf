import { describe, expect, test } from "bun:test";
import { readFile, writeFile } from "node:fs/promises";
import {
  AiNotConfiguredError,
  type AiProvider,
  AiProviderError,
  createMockAiProvider,
} from "@repo/ai";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { DEFAULT_CONVERSION_ENGINE_CONFIG } from "../../engine-config.js";
import {
  isPermanentConversionError,
  PermanentConversionError,
} from "../../errors.js";
import type { RunCommandInput } from "../../process/run-process.js";
import { createConversionWorkspace } from "../../workspace/temp-workspace.js";
import { createAiDocumentEngine } from "./ai-document-engine.js";

const LIMITS = {
  maxPages: 5,
  maxExtractedChars: 1_000,
  maxRequestChars: 1_000,
};

async function writeSourcePdf(path: string, pageCount = 1): Promise<void> {
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Helvetica);

  for (let index = 0; index < pageCount; index += 1) {
    const page = document.addPage([200, 200]);
    page.drawText("Page", { x: 20, y: 100, size: 12, font });
  }

  await writeFile(path, await document.save());
}

function lastArg(input: RunCommandInput): string | undefined {
  return input.args[input.args.length - 1];
}

describe("ai document engine", () => {
  test("summarizes extracted text to txt without sending a PDF", async () => {
    const workspace = await createConversionWorkspace(
      "550e8400-e29b-41d4-a716-446655440401",
    );
    const summarizeCalls: { text: string; language?: string }[] = [];
    const provider: AiProvider = {
      ...createMockAiProvider(),
      async summarize(input) {
        summarizeCalls.push(input);
        return { summary: "Short summary" };
      },
    };

    try {
      const sourcePath = workspace.join("source.pdf");
      await writeSourcePdf(sourcePath);
      const engine = createAiDocumentEngine(DEFAULT_CONVERSION_ENGINE_CONFIG, {
        aiProvider: provider,
        limits: LIMITS,
        isBinaryAvailable: () => true,
        async runCommand(input) {
          expect(input.command).toBe("pdftotext");
          const outputPath = lastArg(input);
          if (outputPath !== undefined) {
            await writeFile(outputPath, "Invoice body text");
          }
        },
      });

      const result = await engine.convert({
        type: "ai-summarizer",
        sourcePath,
        outputDirectory: workspace.directory,
        sourceFormat: "pdf",
        targetFormat: "txt",
        options: {
          type: "ai-summarizer",
          language: "eng",
          outputMode: "txt",
        },
        additionalSourcePaths: [],
      });

      expect(result.filename).toBe("output.txt");
      expect(await readFile(result.outputPath, "utf8")).toBe("Short summary");
      expect(summarizeCalls).toEqual([
        { text: "Invoice body text", language: "eng" },
      ]);
      expect(summarizeCalls[0]?.text.includes("%PDF")).toBe(false);
    } finally {
      await workspace.cleanup();
    }
  });

  test("summarizes to markdown when outputMode is md", async () => {
    const workspace = await createConversionWorkspace(
      "550e8400-e29b-41d4-a716-446655440402",
    );

    try {
      const sourcePath = workspace.join("source.pdf");
      await writeSourcePdf(sourcePath);
      const engine = createAiDocumentEngine(DEFAULT_CONVERSION_ENGINE_CONFIG, {
        aiProvider: createMockAiProvider(),
        limits: LIMITS,
        isBinaryAvailable: () => true,
        async runCommand(input) {
          const outputPath = lastArg(input);
          if (outputPath !== undefined) {
            await writeFile(outputPath, "Markdown source");
          }
        },
      });

      const result = await engine.convert({
        type: "ai-summarizer",
        sourcePath,
        outputDirectory: workspace.directory,
        sourceFormat: "pdf",
        targetFormat: "md",
        options: {
          type: "ai-summarizer",
          language: "eng",
          outputMode: "md",
        },
        additionalSourcePaths: [],
      });

      expect(result.filename).toBe("output.md");
      expect(await readFile(result.outputPath, "utf8")).toContain(
        "Markdown source",
      );
    } finally {
      await workspace.cleanup();
    }
  });

  test("translates to a wrapped PDF", async () => {
    const workspace = await createConversionWorkspace(
      "550e8400-e29b-41d4-a716-446655440403",
    );

    try {
      const sourcePath = workspace.join("source.pdf");
      await writeSourcePdf(sourcePath);
      const engine = createAiDocumentEngine(DEFAULT_CONVERSION_ENGINE_CONFIG, {
        aiProvider: createMockAiProvider(),
        limits: LIMITS,
        isBinaryAvailable: () => true,
        async runCommand(input) {
          const outputPath = lastArg(input);
          if (outputPath !== undefined) {
            await writeFile(outputPath, "Hello world");
          }
        },
      });

      const result = await engine.convert({
        type: "translate-pdf",
        sourcePath,
        outputDirectory: workspace.directory,
        sourceFormat: "pdf",
        targetFormat: "pdf",
        options: { type: "translate-pdf", targetLanguage: "tr" },
        additionalSourcePaths: [],
      });

      const output = await readFile(result.outputPath);
      expect(result.filename).toBe("output.pdf");
      expect(output.subarray(0, 4).toString()).toBe("%PDF");
    } finally {
      await workspace.cleanup();
    }
  });

  test("runs OCR fallback when extracted text is empty", async () => {
    const workspace = await createConversionWorkspace(
      "550e8400-e29b-41d4-a716-446655440404",
    );
    const commands: string[] = [];
    let pdftotextCalls = 0;

    try {
      const sourcePath = workspace.join("source.pdf");
      await writeSourcePdf(sourcePath);
      const engine = createAiDocumentEngine(DEFAULT_CONVERSION_ENGINE_CONFIG, {
        aiProvider: createMockAiProvider(),
        limits: LIMITS,
        isBinaryAvailable: () => true,
        async runCommand(input) {
          commands.push(input.command);

          if (input.command === "ocrmypdf") {
            const outputPath = lastArg(input);
            if (outputPath !== undefined) {
              await writeFile(outputPath, "%PDF-1.4\n");
            }
            return;
          }

          pdftotextCalls += 1;
          const outputPath = lastArg(input);
          if (outputPath !== undefined) {
            await writeFile(
              outputPath,
              pdftotextCalls === 1 ? "   \n" : "Recovered OCR text",
            );
          }
        },
      });

      const result = await engine.convert({
        type: "ai-summarizer",
        sourcePath,
        outputDirectory: workspace.directory,
        sourceFormat: "pdf",
        targetFormat: "txt",
        options: {
          type: "ai-summarizer",
          language: "eng",
          outputMode: "txt",
        },
        additionalSourcePaths: [],
      });

      expect(commands).toEqual(["pdftotext", "ocrmypdf", "pdftotext"]);
      expect(await readFile(result.outputPath, "utf8")).toContain(
        "Recovered OCR text",
      );
    } finally {
      await workspace.cleanup();
    }
  });

  test("rejects documents with no extractable text", async () => {
    const workspace = await createConversionWorkspace(
      "550e8400-e29b-41d4-a716-446655440405",
    );

    try {
      const sourcePath = workspace.join("source.pdf");
      await writeSourcePdf(sourcePath);
      const engine = createAiDocumentEngine(DEFAULT_CONVERSION_ENGINE_CONFIG, {
        aiProvider: createMockAiProvider(),
        limits: LIMITS,
        isBinaryAvailable: (command) => command === "pdftotext",
        async runCommand(input) {
          const outputPath = lastArg(input);
          if (outputPath !== undefined) {
            await writeFile(outputPath, " \n");
          }
        },
      });

      try {
        await engine.convert({
          type: "ai-summarizer",
          sourcePath,
          outputDirectory: workspace.directory,
          sourceFormat: "pdf",
          targetFormat: "txt",
          options: {
            type: "ai-summarizer",
            language: "eng",
            outputMode: "txt",
          },
          additionalSourcePaths: [],
        });
        throw new Error("expected empty document to fail");
      } catch (error) {
        expect(isPermanentConversionError(error)).toBe(true);
        if (error instanceof PermanentConversionError) {
          expect(error.message).toBe("Document has no extractable text");
        }
      }
    } finally {
      await workspace.cleanup();
    }
  });

  test("rejects documents that exceed AI page limits", async () => {
    const workspace = await createConversionWorkspace(
      "550e8400-e29b-41d4-a716-446655440406",
    );

    try {
      const sourcePath = workspace.join("source.pdf");
      await writeSourcePdf(sourcePath, 3);
      const engine = createAiDocumentEngine(DEFAULT_CONVERSION_ENGINE_CONFIG, {
        aiProvider: createMockAiProvider(),
        limits: { ...LIMITS, maxPages: 2 },
        isBinaryAvailable: () => true,
        async runCommand(input) {
          const outputPath = lastArg(input);
          if (outputPath !== undefined) {
            await writeFile(outputPath, "Short");
          }
        },
      });

      try {
        await engine.convert({
          type: "translate-pdf",
          sourcePath,
          outputDirectory: workspace.directory,
          sourceFormat: "pdf",
          targetFormat: "txt",
          options: { type: "translate-pdf", targetLanguage: "en" },
          additionalSourcePaths: [],
        });
        throw new Error("expected oversized document to fail");
      } catch (error) {
        expect(isPermanentConversionError(error)).toBe(true);
      }
    } finally {
      await workspace.cleanup();
    }
  });

  test("maps unconfigured AI providers to a permanent failure", async () => {
    const workspace = await createConversionWorkspace(
      "550e8400-e29b-41d4-a716-446655440407",
    );
    const provider: AiProvider = {
      ...createMockAiProvider(),
      async summarize() {
        throw new AiNotConfiguredError();
      },
      async translate() {
        throw new AiProviderError();
      },
    };

    try {
      const sourcePath = workspace.join("source.pdf");
      await writeSourcePdf(sourcePath);
      const engine = createAiDocumentEngine(DEFAULT_CONVERSION_ENGINE_CONFIG, {
        aiProvider: provider,
        limits: LIMITS,
        isBinaryAvailable: () => true,
        async runCommand(input) {
          const outputPath = lastArg(input);
          if (outputPath !== undefined) {
            await writeFile(outputPath, "Configurable");
          }
        },
      });

      try {
        await engine.convert({
          type: "ai-summarizer",
          sourcePath,
          outputDirectory: workspace.directory,
          sourceFormat: "pdf",
          targetFormat: "txt",
          options: {
            type: "ai-summarizer",
            language: "eng",
            outputMode: "txt",
          },
          additionalSourcePaths: [],
        });
        throw new Error("expected unconfigured provider to fail");
      } catch (error) {
        expect(isPermanentConversionError(error)).toBe(true);
      }
    } finally {
      await workspace.cleanup();
    }
  });
});
