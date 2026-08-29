import { mkdir, readdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import type { FileFormat } from "@sohappypdf/conversions";
import type { ConversionEngineResult } from "../../engine.js";
import { outputFilename, outputMimeType } from "../../engine.js";
import type { ConversionEngineConfig } from "../../engine-config.js";
import { outputValidationError } from "../../errors.js";
import { validateConversionOutput } from "../../output-validation.js";
import type { RunAllowedCommand } from "../../process/run-process.js";
import { joinJobPath } from "../../workspace/temp-workspace.js";

export type LibreOfficeRunContext = {
  config: ConversionEngineConfig;
  runCommand: RunAllowedCommand;
  outputDirectory: string;
};

export async function prepareLibreOfficeDirectories(
  outputDirectory: string,
): Promise<{
  profileDirectory: string;
  outputDir: string;
}> {
  const profileDirectory = joinJobPath(outputDirectory, "lo-profile");
  const outputDir = joinJobPath(outputDirectory, "lo-out");
  await mkdir(profileDirectory, { recursive: true });
  await mkdir(outputDir, { recursive: true });
  return { profileDirectory, outputDir };
}

export function libreOfficeBaseArgs(profileDirectory: string): string[] {
  return [
    "--headless",
    "--nologo",
    "--nofirststartwizard",
    "--norestore",
    `-env:UserInstallation=${pathToFileURL(profileDirectory).href}`,
  ];
}

export async function runLibreOfficeConvert(
  ctx: LibreOfficeRunContext,
  input: {
    profileDirectory: string;
    outputDir: string;
    sourcePath: string;
    convertTo: string;
    infilter?: string;
  },
): Promise<void> {
  const args = [
    ...libreOfficeBaseArgs(input.profileDirectory),
    ...(input.infilter === undefined ? [] : [`--infilter=${input.infilter}`]),
    "--convert-to",
    input.convertTo,
    "--outdir",
    input.outputDir,
    input.sourcePath,
  ];

  await ctx.runCommand({
    command: ctx.config.libreOfficeBin,
    args,
    cwd: ctx.outputDirectory,
    timeoutMs: ctx.config.conversionTimeoutMs,
  });
}

export async function readLibreOfficeOutput(
  outputDir: string,
  format: FileFormat,
  maxBytes: number,
): Promise<ConversionEngineResult> {
  const extension = format === "jpg" ? "jpg" : format;
  const entries = await readdir(outputDir);
  const outputName = entries.find((entry) => entry.endsWith(`.${extension}`));

  if (outputName === undefined) {
    throw outputValidationError();
  }

  const outputPath = joinJobPath(outputDir, outputName);
  await validateConversionOutput({
    outputPath,
    expectedFormat: format,
    maxBytes,
  });

  return {
    outputPath,
    mimeType: outputMimeType(format),
    filename: outputFilename(format),
  };
}
