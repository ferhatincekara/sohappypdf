import { access } from "node:fs/promises";
import type { WorkerConfig } from "@repo/config";
import { PermanentConversionError } from "../job-errors.js";
import { runAllowedCommand } from "../process/run-command.js";
import { joinJobPath } from "../temp/job-temp-directory.js";
import type {
  ConversionEngine,
  ConversionEngineResult,
} from "./conversion-engine.js";
import { OUTPUT_MIME_TYPES } from "./conversion-engine.js";

export function createPdfImageEngine(config: WorkerConfig): ConversionEngine {
  return {
    name: "pdf-image",
    canHandle(type) {
      return type === "pdf-to-jpg" || type === "pdf-to-png";
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

      await runAllowedCommand({
        command: config.pdftoppmBin,
        args,
        cwd: input.outputDirectory,
        timeoutMs: config.conversionTimeoutMs,
      });

      const outputPath = `${prefix}.${format}`;
      await assertOutputExists(outputPath);

      return {
        outputPath,
        mimeType:
          format === "jpg" ? OUTPUT_MIME_TYPES.jpg : OUTPUT_MIME_TYPES.png,
        filename: `output.${format}`,
      } satisfies ConversionEngineResult;
    },
  };
}

async function assertOutputExists(outputPath: string): Promise<void> {
  try {
    await access(outputPath);
  } catch {
    throw new PermanentConversionError(
      "processing_failed",
      "Conversion produced no output",
    );
  }
}
