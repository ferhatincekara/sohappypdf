import { copyFile, readFile } from "node:fs/promises";
import { type ConversionType, isConversionSupported } from "@repo/conversions";
import type { ConversionEngine } from "../../engine.js";
import { outputFilename, outputMimeType } from "../../engine.js";
import type { ConversionEngineConfig } from "../../engine-config.js";
import {
  invalidInputError,
  unsupportedConversionError,
} from "../../errors.js";
import { isConversionBinaryAvailable } from "../../native-binary.js";
import { validateConversionOutput } from "../../output-validation.js";
import {
  type RunAllowedCommand,
  runAllowedCommand,
} from "../../process/run-process.js";
import { joinJobPath } from "../../workspace/temp-workspace.js";

const TYPES = ["ocr-pdf"] as const satisfies readonly ConversionType[];

export function createOcrEngine(
  config: ConversionEngineConfig,
  options: {
    runCommand?: RunAllowedCommand;
    isBinaryAvailable?: (command: string) => boolean;
  } = {},
): ConversionEngine {
  const runCommand = options.runCommand ?? runAllowedCommand;
  const isBinaryAvailable =
    options.isBinaryAvailable ?? isConversionBinaryAvailable;

  return {
    name: "ocr",
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
      if (input.options.type !== "ocr-pdf") {
        throw unsupportedConversionError();
      }

      if (!isBinaryAvailable(config.ocrMyPdfBin)) {
        throw invalidInputError("OCR conversion is not available on this worker");
      }

      const searchablePdfPath = joinJobPath(input.outputDirectory, "ocr.pdf");

      await runCommand({
        command: config.ocrMyPdfBin,
        args: [
          // Skip pages that already have a text layer; OCR only image/scanned pages.
          "--skip-text",
          "--optimize",
          "0",
          "--output-type",
          "pdf",
          "-l",
          input.options.language,
          input.sourcePath,
          searchablePdfPath,
        ],
        cwd: input.outputDirectory,
        timeoutMs: config.conversionTimeoutMs,
      });

      if (input.options.outputMode === "txt" || input.targetFormat === "txt") {
        const outputPath = joinJobPath(input.outputDirectory, "output.txt");
        await runCommand({
          command: config.pdftotextBin,
          args: ["-enc", "UTF-8", searchablePdfPath, outputPath],
          cwd: input.outputDirectory,
          timeoutMs: config.conversionTimeoutMs,
        });

        const text = await readFile(outputPath, "utf8");
        if (text.trim().length === 0) {
          throw invalidInputError();
        }

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
      await copyFile(searchablePdfPath, outputPath);
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
