import { type ConversionType, isConversionSupported } from "@repo/conversions";
import type { ConversionEngine } from "../../engine.js";
import type { ConversionEngineConfig } from "../../engine-config.js";
import { unsupportedConversionError } from "../../errors.js";
import {
  type RunAllowedCommand,
  runAllowedCommand,
} from "../../process/run-process.js";
import type { LibreOfficeRunContext } from "./libreoffice-runner.js";
import { convertOfficeDocumentToPdf } from "./office-to-pdf.js";
import { convertPdfToPresentation } from "./pdf-to-presentation.js";
import { convertPdfToSpreadsheet } from "./pdf-to-spreadsheet.js";
import { convertPdfToWord } from "./pdf-to-word.js";

const TYPES = [
  "pdf-to-word",
  "pdf-to-excel",
  "pdf-to-powerpoint",
  "word-to-pdf",
  "excel-to-pdf",
  "powerpoint-to-pdf",
  "office-to-pdf",
] as const satisfies readonly ConversionType[];

export function createOfficeEngine(
  config: ConversionEngineConfig,
  options: { runCommand?: RunAllowedCommand } = {},
): ConversionEngine {
  const runCommand = options.runCommand ?? runAllowedCommand;

  return {
    name: "office",
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
      const ctx: LibreOfficeRunContext = {
        config,
        runCommand,
        outputDirectory: input.outputDirectory,
      };

      switch (input.type) {
        case "pdf-to-word":
          if (input.targetFormat !== "docx") {
            throw unsupportedConversionError();
          }
          return convertPdfToWord(ctx, input);
        case "pdf-to-excel":
          if (input.targetFormat !== "xlsx") {
            throw unsupportedConversionError();
          }
          return convertPdfToSpreadsheet(ctx, input);
        case "pdf-to-powerpoint":
          if (input.targetFormat !== "pptx") {
            throw unsupportedConversionError();
          }
          return convertPdfToPresentation(ctx, input);
        case "word-to-pdf":
        case "excel-to-pdf":
        case "powerpoint-to-pdf":
        case "office-to-pdf":
          if (input.targetFormat !== "pdf") {
            throw unsupportedConversionError();
          }
          return convertOfficeDocumentToPdf(ctx, input);
        default:
          throw unsupportedConversionError();
      }
    },
  };
}
