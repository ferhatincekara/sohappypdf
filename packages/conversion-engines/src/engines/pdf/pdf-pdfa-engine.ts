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

const TYPES = ["pdf-to-pdfa"] as const satisfies readonly ConversionType[];

/**
 * Converts to PDF/A-2b via Ghostscript. Best-effort archival output;
 * not all source PDFs validate as PDF/A without font/color fixes.
 */
export function createPdfPdfaEngine(
  config: ConversionEngineConfig,
  options: { runCommand?: RunAllowedCommand } = {},
): ConversionEngine {
  const runCommand = options.runCommand ?? runAllowedCommand;

  return {
    name: "pdf-pdfa",
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
      if (input.options.type !== "pdf-to-pdfa") {
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
          "-dPDFA=2",
          "-dPDFACompatibilityPolicy=1",
          "-sColorConversionStrategy=RGB",
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
