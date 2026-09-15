import { copyFile, readFile } from "node:fs/promises";
import {
  type ConversionType,
  isConversionSupported,
} from "@sohappypdf/conversions";
import type { ConversionEngine } from "../../engine.js";
import { outputFilename, outputMimeType } from "../../engine.js";
import type { ConversionEngineConfig } from "../../engine-config.js";
import { invalidInputError, unsupportedConversionError } from "../../errors.js";
import { isConversionBinaryAvailable } from "../../native-binary.js";
import { validateConversionOutput } from "../../output-validation.js";
import {
  type RunAllowedCommand,
  runAllowedCommand,
} from "../../process/run-process.js";
import { joinJobPath } from "../../workspace/temp-workspace.js";
import { renderSearchablePdf } from "./render-searchable-pdf.js";

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
        throw invalidInputError(
          "OCR conversion is not available on this worker",
        );
      }

      const extractText = async (
        pdfPath: string,
        outputPath: string,
      ): Promise<string> => {
        await runCommand({
          command: config.pdftotextBin,
          args: ["-enc", "UTF-8", pdfPath, outputPath],
          cwd: input.outputDirectory,
          timeoutMs: config.conversionTimeoutMs,
        });

        return readFile(outputPath, "utf8");
      };

      const wantsText =
        input.options.outputMode === "txt" || input.targetFormat === "txt";
      const existingTextPath = joinJobPath(
        input.outputDirectory,
        wantsText ? "output.txt" : "existing.txt",
      );

      let existingText: string | undefined;
      try {
        existingText = await extractText(input.sourcePath, existingTextPath);
      } catch {
        existingText = undefined;
      }

      if (existingText !== undefined && existingText.trim().length > 0) {
        if (wantsText) {
          await validateConversionOutput({
            outputPath: existingTextPath,
            expectedFormat: "txt",
            maxBytes: config.maxOutputFileSizeBytes,
          });

          return {
            outputPath: existingTextPath,
            mimeType: outputMimeType("txt"),
            filename: outputFilename("txt"),
          };
        }

        const outputPath = joinJobPath(input.outputDirectory, "output.pdf");
        await copyFile(input.sourcePath, outputPath);
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
      }

      const searchablePdfPath = joinJobPath(input.outputDirectory, "ocr.pdf");
      const ocrInput = {
        config,
        runCommand,
        sourcePath: input.sourcePath,
        outputDirectory: input.outputDirectory,
        outputPath: searchablePdfPath,
        language: input.options.language,
      };
      const rendered = await renderSearchablePdf(ocrInput);

      if (wantsText) {
        const outputPath = joinJobPath(input.outputDirectory, "output.txt");
        let text = await extractText(searchablePdfPath, outputPath);
        if (text.trim().length === 0 && !rendered.forcedOcr) {
          await renderSearchablePdf({
            ...ocrInput,
            forceOcr: true,
          });
          text = await extractText(searchablePdfPath, outputPath);
        }

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
