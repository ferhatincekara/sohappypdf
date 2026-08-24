import { readFile, writeFile } from "node:fs/promises";
import {
  type AiDocumentLimits,
  AiDocumentTooLargeError,
  AiNotConfiguredError,
  type AiProvider,
  AiProviderError,
  aiLimitsFromConfig,
  assertAiDocumentWithinLimits,
  createAiProvider,
} from "@repo/ai";
import { loadAiConfig } from "@repo/config";
import { type ConversionType, isConversionSupported } from "@repo/conversions";
import { PDFDocument, type PDFFont, StandardFonts } from "pdf-lib";
import type { ConversionEngine } from "../../engine.js";
import { outputFilename, outputMimeType } from "../../engine.js";
import type { ConversionEngineConfig } from "../../engine-config.js";
import {
  invalidInputError,
  nativeToolFailureError,
  unsupportedConversionError,
} from "../../errors.js";
import { isConversionBinaryAvailable } from "../../native-binary.js";
import { validateConversionOutput } from "../../output-validation.js";
import {
  type RunAllowedCommand,
  runAllowedCommand,
} from "../../process/run-process.js";
import { joinJobPath } from "../../workspace/temp-workspace.js";
import { loadPdfDocument } from "../pdf/pdf-page-operations.js";

const TYPES = [
  "ai-summarizer",
  "translate-pdf",
] as const satisfies readonly ConversionType[];

const LETTER_WIDTH = 612;
const LETTER_HEIGHT = 792;
const PAGE_MARGIN = 50;
const BODY_FONT_SIZE = 11;
const LINE_HEIGHT = 15;

export type AiDocumentEngineOptions = {
  runCommand?: RunAllowedCommand;
  isBinaryAvailable?: (command: string) => boolean;
  aiProvider?: AiProvider;
  limits?: AiDocumentLimits;
};

function mapAiFailure(error: unknown): never {
  if (error instanceof AiDocumentTooLargeError) {
    throw invalidInputError(error.message);
  }

  if (error instanceof AiNotConfiguredError) {
    throw nativeToolFailureError("AI provider is not configured");
  }

  if (error instanceof AiProviderError) {
    throw nativeToolFailureError("AI provider request failed");
  }

  throw error;
}

function sanitizeForStandardFont(
  text: string,
  font: PDFFont,
  size: number,
): string {
  let sanitized = "";

  for (const character of text) {
    if (character === "\n" || character === "\r") {
      sanitized += character;
      continue;
    }

    if (character === "\t") {
      sanitized += " ";
      continue;
    }

    try {
      font.widthOfTextAtSize(character, size);
      sanitized += character;
    } catch {
      sanitized += "?";
    }
  }

  return sanitized;
}

function wrapLine(
  line: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  if (line.length === 0) {
    return [""];
  }

  const words = line.split(/\s+/);
  const wrapped: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current.length === 0 ? word : `${current} ${word}`;
    const width = font.widthOfTextAtSize(candidate, size);

    if (width <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current.length > 0) {
      wrapped.push(current);
    }

    current = word;
  }

  if (current.length > 0) {
    wrapped.push(current);
  }

  return wrapped.length === 0 ? [""] : wrapped;
}

async function writeWrappedTextPdf(
  text: string,
  outputPath: string,
): Promise<void> {
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Helvetica);
  const sanitized = sanitizeForStandardFont(text, font, BODY_FONT_SIZE);
  const maxWidth = LETTER_WIDTH - PAGE_MARGIN * 2;
  const wrapped = sanitized
    .split(/\r?\n/)
    .flatMap((line) => wrapLine(line, font, BODY_FONT_SIZE, maxWidth));

  let page = document.addPage([LETTER_WIDTH, LETTER_HEIGHT]);
  let y = LETTER_HEIGHT - PAGE_MARGIN;

  for (const line of wrapped) {
    if (y < PAGE_MARGIN) {
      page = document.addPage([LETTER_WIDTH, LETTER_HEIGHT]);
      y = LETTER_HEIGHT - PAGE_MARGIN;
    }

    page.drawText(line.length === 0 ? " " : line, {
      x: PAGE_MARGIN,
      y,
      size: BODY_FONT_SIZE,
      font,
    });
    y -= LINE_HEIGHT;
  }

  await writeFile(outputPath, await document.save());
}

export function createAiDocumentEngine(
  config: ConversionEngineConfig,
  options: AiDocumentEngineOptions = {},
): ConversionEngine {
  const runCommand = options.runCommand ?? runAllowedCommand;
  const isBinaryAvailable =
    options.isBinaryAvailable ?? isConversionBinaryAvailable;
  const limits = options.limits ?? aiLimitsFromConfig(loadAiConfig());

  return {
    name: "ai",
    types: TYPES,
    canHandle(type) {
      return TYPES.some((supported) => supported === type);
    },
    supports(query) {
      return (
        this.canHandle(query.type) &&
        isConversionSupported(
          query.type,
          query.sourceFormat,
          query.targetFormat,
        )
      );
    },
    async convert(input) {
      if (
        input.options.type !== "ai-summarizer" &&
        input.options.type !== "translate-pdf"
      ) {
        throw unsupportedConversionError();
      }

      if (!isBinaryAvailable(config.pdftotextBin)) {
        throw nativeToolFailureError("PDF text extraction is not available");
      }

      const sourceDocument = await loadPdfDocument(input.sourcePath);
      const pageCount = sourceDocument.getPageCount();
      const extractedPath = joinJobPath(input.outputDirectory, "extracted.txt");

      await runCommand({
        command: config.pdftotextBin,
        args: ["-enc", "UTF-8", input.sourcePath, extractedPath],
        cwd: input.outputDirectory,
        timeoutMs: config.conversionTimeoutMs,
      });

      let extractedText = await readFile(extractedPath, "utf8");

      if (
        extractedText.trim().length === 0 &&
        isBinaryAvailable(config.ocrMyPdfBin)
      ) {
        const ocrLanguage =
          input.options.type === "ai-summarizer"
            ? input.options.language
            : (input.options.sourceLanguage ?? "eng");
        const searchablePdfPath = joinJobPath(input.outputDirectory, "ocr.pdf");

        await runCommand({
          command: config.ocrMyPdfBin,
          args: [
            "--skip-text",
            "--optimize",
            "0",
            "--output-type",
            "pdf",
            "-l",
            ocrLanguage,
            input.sourcePath,
            searchablePdfPath,
          ],
          cwd: input.outputDirectory,
          timeoutMs: config.conversionTimeoutMs,
        });

        await runCommand({
          command: config.pdftotextBin,
          args: ["-enc", "UTF-8", searchablePdfPath, extractedPath],
          cwd: input.outputDirectory,
          timeoutMs: config.conversionTimeoutMs,
        });

        extractedText = await readFile(extractedPath, "utf8");
      }

      if (extractedText.trim().length === 0) {
        throw invalidInputError("Document has no extractable text");
      }

      try {
        assertAiDocumentWithinLimits({
          pageCount,
          extractedChars: extractedText.length,
          limits,
        });
      } catch (error) {
        mapAiFailure(error);
      }

      const provider = options.aiProvider ?? createAiProvider();
      let resultText: string;

      try {
        if (input.options.type === "ai-summarizer") {
          const summarized = await provider.summarize({
            text: extractedText,
            language: input.options.language,
          });
          resultText = summarized.summary;
        } else {
          const translated = await provider.translate({
            text: extractedText,
            targetLanguage: input.options.targetLanguage,
            ...(input.options.sourceLanguage === undefined
              ? {}
              : { sourceLanguage: input.options.sourceLanguage }),
          });
          resultText = translated.text;
        }
      } catch (error) {
        mapAiFailure(error);
      }

      if (resultText.trim().length === 0) {
        throw invalidInputError("AI conversion produced no output");
      }

      if (input.options.type === "ai-summarizer") {
        const format =
          input.options.outputMode === "md" || input.targetFormat === "md"
            ? "md"
            : "txt";
        const outputPath = joinJobPath(
          input.outputDirectory,
          outputFilename(format),
        );
        await writeFile(outputPath, resultText, "utf8");
        await validateConversionOutput({
          outputPath,
          expectedFormat: format,
          maxBytes: config.maxOutputFileSizeBytes,
        });

        return {
          outputPath,
          mimeType: outputMimeType(format),
          filename: outputFilename(format),
        };
      }

      if (input.targetFormat === "txt") {
        const outputPath = joinJobPath(input.outputDirectory, "output.txt");
        await writeFile(outputPath, resultText, "utf8");
        await validateConversionOutput({
          outputPath,
          expectedFormat: "txt",
          maxBytes: config.maxOutputFileSizeBytes,
        });

        return {
          outputPath,
          mimeType: outputMimeType("txt"),
          filename: outputFilename("txt"),
        };
      }

      const outputPath = joinJobPath(input.outputDirectory, "output.pdf");
      await writeWrappedTextPdf(resultText, outputPath);
      await validateConversionOutput({
        outputPath,
        expectedFormat: "pdf",
        maxBytes: config.maxOutputFileSizeBytes,
      });

      return {
        outputPath,
        mimeType: outputMimeType("pdf"),
        filename: outputFilename("pdf"),
      };
    },
  };
}
