import { access } from "node:fs/promises";
import type { WorkerConfig } from "@repo/config";
import { PermanentConversionError } from "../job-errors.js";
import { runAllowedCommand } from "../process/run-command.js";
import { joinJobPath } from "../temp/job-temp-directory.js";
import type { ConversionEngine } from "./conversion-engine.js";
import { OUTPUT_MIME_TYPES } from "./conversion-engine.js";

export function createPdfTextEngine(config: WorkerConfig): ConversionEngine {
  return {
    name: "pdf-text",
    canHandle(type) {
      return type === "pdf-to-txt";
    },
    async convert(input) {
      if (input.type !== "pdf-to-txt") {
        throw new PermanentConversionError(
          "unsupported_conversion",
          "Unsupported conversion",
        );
      }

      const outputPath = joinJobPath(input.outputDirectory, "output.txt");

      await runAllowedCommand({
        command: config.pdftotextBin,
        args: ["-enc", "UTF-8", input.sourcePath, outputPath],
        cwd: input.outputDirectory,
        timeoutMs: config.conversionTimeoutMs,
      });

      try {
        await access(outputPath);
      } catch {
        throw new PermanentConversionError(
          "processing_failed",
          "Conversion produced no output",
        );
      }

      return {
        outputPath,
        mimeType: OUTPUT_MIME_TYPES.txt,
        filename: "output.txt",
      };
    },
  };
}
