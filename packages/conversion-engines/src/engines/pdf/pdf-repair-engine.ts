import type { ConversionType } from "@sohappypdf/conversions";
import { isConversionSupported } from "@sohappypdf/conversions";
import type { ConversionEngine } from "../../engine.js";
import { outputFilename, outputMimeType } from "../../engine.js";
import type { ConversionEngineConfig } from "../../engine-config.js";
import { unsupportedConversionError } from "../../errors.js";
import { validateConversionOutput } from "../../output-validation.js";
import {
  type RunAllowedCommand,
  runAllowedCommand,
} from "../../process/run-process.js";
import {
  assertPathInside,
  joinJobPath,
} from "../../workspace/temp-workspace.js";

const TYPES = ["repair-pdf"] as const satisfies readonly ConversionType[];

export function createPdfRepairEngine(
  config: ConversionEngineConfig,
  options: { runCommand?: RunAllowedCommand } = {},
): ConversionEngine {
  const runCommand = options.runCommand ?? runAllowedCommand;

  return {
    name: "pdf-repair",
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
      if (input.options.type !== "repair-pdf") {
        throw unsupportedConversionError();
      }

      const outputPath = joinJobPath(input.outputDirectory, "output.pdf");
      const safeOutput = assertPathInside(input.outputDirectory, outputPath);

      await runCommand({
        command: config.ghostscriptBin,
        args: [
          "-dSAFER",
          "-dBATCH",
          "-dNOPAUSE",
          "-dQUIET",
          "-sDEVICE=pdfwrite",
          "-dPDFSETTINGS=/prepress",
          `-sOutputFile=${safeOutput}`,
          input.sourcePath,
        ],
        cwd: input.outputDirectory,
        timeoutMs: config.conversionTimeoutMs,
      });

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
