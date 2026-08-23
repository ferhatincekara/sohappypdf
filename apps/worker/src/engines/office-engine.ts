import { mkdir, readdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import type { WorkerConfig } from "@repo/config";
import { PermanentConversionError } from "../job-errors.js";
import { runAllowedCommand } from "../process/run-command.js";
import { joinJobPath } from "../temp/job-temp-directory.js";
import type {
  ConversionEngine,
  ConversionEngineResult,
} from "./conversion-engine.js";
import { OUTPUT_MIME_TYPES } from "./conversion-engine.js";

export function createOfficeEngine(config: WorkerConfig): ConversionEngine {
  return {
    name: "office",
    canHandle(type) {
      return type === "pdf-to-word";
    },
    async convert(input) {
      if (input.type !== "pdf-to-word" || input.targetFormat !== "docx") {
        throw new PermanentConversionError(
          "unsupported_conversion",
          "Unsupported conversion",
        );
      }

      const profileDirectory = joinJobPath(input.outputDirectory, "lo-profile");
      const outputDirectory = joinJobPath(input.outputDirectory, "lo-out");
      await mkdir(profileDirectory, { recursive: true });
      await mkdir(outputDirectory, { recursive: true });

      await runAllowedCommand({
        command: config.libreOfficeBin,
        args: [
          "--headless",
          "--nologo",
          "--nofirststartwizard",
          "--norestore",
          `-env:UserInstallation=${pathToFileURL(profileDirectory).href}`,
          "--convert-to",
          "docx",
          "--outdir",
          outputDirectory,
          input.sourcePath,
        ],
        cwd: input.outputDirectory,
        timeoutMs: config.conversionTimeoutMs,
      });

      return readConvertedOfficeFile(outputDirectory);
    },
  };
}

async function readConvertedOfficeFile(
  outputDirectory: string,
): Promise<ConversionEngineResult> {
  const entries = await readdir(outputDirectory);
  const outputName = entries.find((entry) => entry.endsWith(".docx"));

  if (outputName === undefined) {
    throw new PermanentConversionError(
      "processing_failed",
      "Conversion produced no output",
    );
  }

  return {
    outputPath: joinJobPath(outputDirectory, outputName),
    mimeType: OUTPUT_MIME_TYPES.docx,
    filename: "output.docx",
  };
}
