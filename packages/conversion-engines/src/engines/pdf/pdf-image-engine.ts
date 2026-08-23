import { type ConversionType, isConversionSupported } from "@repo/conversions";
import type { ConversionEngine, ConversionEngineResult } from "../../engine.js";
import { outputFilename, outputMimeType } from "../../engine.js";
import type { ConversionEngineConfig } from "../../engine-config.js";
import { PermanentConversionError } from "../../errors.js";
import { validateConversionOutput } from "../../output-validation.js";
import {
  type RunAllowedCommand,
  runAllowedCommand,
} from "../../process/run-process.js";
import { joinJobPath } from "../../workspace/temp-workspace.js";

const TYPES = [
  "pdf-to-jpg",
  "pdf-to-png",
] as const satisfies readonly ConversionType[];

export function createPdfImageEngine(
  config: ConversionEngineConfig,
  options: { runCommand?: RunAllowedCommand } = {},
): ConversionEngine {
  const runCommand = options.runCommand ?? runAllowedCommand;

  return {
    name: "pdf-image",
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
        input.options.type !== "pdf-to-jpg" &&
        input.options.type !== "pdf-to-png"
      ) {
        throw new PermanentConversionError(
          "invalid_options",
          "Invalid conversion options",
        );
      }

      const format = input.options.type === "pdf-to-jpg" ? "jpg" : "png";
      const page = input.options.page ?? 1;
      const dpi = input.options.dpi ?? 150;
      const prefix = joinJobPath(input.outputDirectory, "page");
      const args = [
        format === "jpg" ? "-jpeg" : "-png",
        "-singlefile",
        "-r",
        String(dpi),
        "-f",
        String(page),
        "-l",
        String(page),
      ];

      if (format === "jpg" && input.options.quality !== undefined) {
        args.push("-jpegopt", `quality=${input.options.quality}`);
      }

      args.push(input.sourcePath, prefix);

      await runCommand({
        command: config.pdftoppmBin,
        args,
        cwd: input.outputDirectory,
        timeoutMs: config.conversionTimeoutMs,
      });

      const outputPath = `${prefix}.${format}`;
      await validateConversionOutput({
        outputPath,
        expectedFormat: format,
        maxBytes: config.maxOutputFileSizeBytes,
      });

      return {
        outputPath,
        mimeType: outputMimeType(format),
        filename: outputFilename(format),
      } satisfies ConversionEngineResult;
    },
  };
}
