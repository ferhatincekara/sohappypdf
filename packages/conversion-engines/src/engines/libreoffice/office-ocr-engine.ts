import { type ConversionType, isConversionSupported } from "@repo/conversions";
import type { ConversionEngine } from "../../engine.js";
import type { ConversionEngineConfig } from "../../engine-config.js";
import { invalidInputError, unsupportedConversionError } from "../../errors.js";
import { isConversionBinaryAvailable } from "../../native-binary.js";
import {
  type RunAllowedCommand,
  runAllowedCommand,
} from "../../process/run-process.js";
import { joinJobPath } from "../../workspace/temp-workspace.js";
import type { LibreOfficeRunContext } from "./libreoffice-runner.js";
import { convertPdfToSpreadsheet } from "./pdf-to-spreadsheet.js";
import { convertPdfToWord } from "./pdf-to-word.js";

const TYPES = [
  "pdf-to-word-ocr",
  "pdf-to-excel-ocr",
] as const satisfies readonly ConversionType[];

export function createOfficeOcrEngine(
  config: ConversionEngineConfig,
  options: {
    runCommand?: RunAllowedCommand;
    isBinaryAvailable?: (command: string) => boolean;
  } = {},
): ConversionEngine {
  const runCommand = options.runCommand ?? runAllowedCommand;

  return {
    name: "office-ocr",
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
      const isBinaryAvailable =
        options.isBinaryAvailable ?? isConversionBinaryAvailable;

      if (!isBinaryAvailable(config.ocrMyPdfBin)) {
        throw invalidInputError(
          "OCR conversion is not available on this worker",
        );
      }

      const ctx: LibreOfficeRunContext = {
        config,
        runCommand,
        outputDirectory: input.outputDirectory,
      };

      const language =
        input.options.type === "pdf-to-word-ocr" ||
        input.options.type === "pdf-to-excel-ocr"
          ? input.options.language
          : "eng";

      const ocrPdfPath = joinJobPath(input.outputDirectory, "ocr.pdf");
      await runCommand({
        command: config.ocrMyPdfBin,
        args: [
          "--skip-text",
          "--optimize",
          "0",
          "--output-type",
          "pdf",
          "-l",
          language,
          input.sourcePath,
          ocrPdfPath,
        ],
        cwd: input.outputDirectory,
        timeoutMs: config.conversionTimeoutMs,
      });

      const ocrInput = {
        ...input,
        sourcePath: ocrPdfPath,
      };

      switch (input.type) {
        case "pdf-to-word-ocr":
          if (input.targetFormat !== "docx") {
            throw unsupportedConversionError();
          }
          return convertPdfToWord(ctx, ocrInput);
        case "pdf-to-excel-ocr":
          if (input.targetFormat !== "xlsx") {
            throw unsupportedConversionError();
          }
          return convertPdfToSpreadsheet(ctx, ocrInput);
        default:
          throw unsupportedConversionError();
      }
    },
  };
}
