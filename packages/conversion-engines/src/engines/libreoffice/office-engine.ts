import { mkdir, readdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { type ConversionType, isConversionSupported } from "@repo/conversions";
import type { ConversionEngine, ConversionEngineResult } from "../../engine.js";
import { outputFilename, outputMimeType } from "../../engine.js";
import type { ConversionEngineConfig } from "../../engine-config.js";
import {
  outputValidationError,
  unsupportedConversionError,
} from "../../errors.js";
import { validateConversionOutput } from "../../output-validation.js";
import {
  type RunAllowedCommand,
  runAllowedCommand,
} from "../../process/run-process.js";
import { joinJobPath } from "../../workspace/temp-workspace.js";

const TYPES = ["pdf-to-word"] as const satisfies readonly ConversionType[];

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
      if (input.type !== "pdf-to-word" || input.targetFormat !== "docx") {
        throw unsupportedConversionError();
      }

      const profileDirectory = joinJobPath(input.outputDirectory, "lo-profile");
      const outputDirectory = joinJobPath(input.outputDirectory, "lo-out");
      await mkdir(profileDirectory, { recursive: true });
      await mkdir(outputDirectory, { recursive: true });

      await runCommand({
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

      return readConvertedOfficeFile(
        outputDirectory,
        config.maxOutputFileSizeBytes,
      );
    },
  };
}

async function readConvertedOfficeFile(
  outputDirectory: string,
  maxBytes: number,
): Promise<ConversionEngineResult> {
  const entries = await readdir(outputDirectory);
  const outputName = entries.find((entry) => entry.endsWith(".docx"));

  if (outputName === undefined) {
    throw outputValidationError();
  }

  const outputPath = joinJobPath(outputDirectory, outputName);
  await validateConversionOutput({
    outputPath,
    expectedFormat: "docx",
    maxBytes,
  });

  return {
    outputPath,
    mimeType: outputMimeType("docx"),
    filename: outputFilename("docx"),
  };
}
