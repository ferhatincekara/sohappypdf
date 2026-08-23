import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
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
import { layoutPagesToHtml } from "../pdf/layout-html.js";
import { countLayoutWords, parsePdfLayout } from "../pdf/pdf-layout.js";

const TYPES = ["pdf-to-word"] as const satisfies readonly ConversionType[];
const MAX_LAYOUT_BYTES = 8 * 1024 * 1024;

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

      const htmlPath = await writeReconstructedHtml({
        config,
        runCommand,
        sourcePath: input.sourcePath,
        outputDirectory: input.outputDirectory,
      });

      await runCommand({
        command: config.libreOfficeBin,
        args:
          htmlPath === undefined
            ? libreOfficePdfImportArgs({
                profileDirectory,
                outputDirectory,
                sourcePath: input.sourcePath,
              })
            : libreOfficeHtmlExportArgs({
                profileDirectory,
                outputDirectory,
                htmlPath,
              }),
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

async function writeReconstructedHtml(input: {
  config: ConversionEngineConfig;
  runCommand: RunAllowedCommand;
  sourcePath: string;
  outputDirectory: string;
}): Promise<string | undefined> {
  const layoutPath = joinJobPath(input.outputDirectory, "layout.html");

  await input.runCommand({
    command: input.config.pdftotextBin,
    args: ["-bbox-layout", "-enc", "UTF-8", input.sourcePath, layoutPath],
    cwd: input.outputDirectory,
    timeoutMs: input.config.conversionTimeoutMs,
  });

  const layoutStat = await stat(layoutPath).catch(() => undefined);

  if (
    layoutStat === undefined ||
    layoutStat.size < 1 ||
    layoutStat.size > MAX_LAYOUT_BYTES
  ) {
    return undefined;
  }

  const layoutXml = await readFile(layoutPath, "utf8");

  if (layoutXml.length === 0) {
    return undefined;
  }

  const pages = parsePdfLayout(layoutXml);

  if (countLayoutWords(pages) === 0) {
    return undefined;
  }

  const htmlPath = joinJobPath(input.outputDirectory, "document.html");
  await writeFile(htmlPath, layoutPagesToHtml(pages), "utf8");
  return htmlPath;
}

function libreOfficeHtmlExportArgs(input: {
  profileDirectory: string;
  outputDirectory: string;
  htmlPath: string;
}): string[] {
  return [
    "--headless",
    "--nologo",
    "--nofirststartwizard",
    "--norestore",
    `-env:UserInstallation=${pathToFileURL(input.profileDirectory).href}`,
    "--infilter=HTML (StarWriter)",
    "--convert-to",
    "docx:Office Open XML Text",
    "--outdir",
    input.outputDirectory,
    input.htmlPath,
  ];
}

function libreOfficePdfImportArgs(input: {
  profileDirectory: string;
  outputDirectory: string;
  sourcePath: string;
}): string[] {
  return [
    "--headless",
    "--nologo",
    "--nofirststartwizard",
    "--norestore",
    `-env:UserInstallation=${pathToFileURL(input.profileDirectory).href}`,
    "--infilter=writer_pdf_import",
    "--convert-to",
    "docx",
    "--outdir",
    input.outputDirectory,
    input.sourcePath,
  ];
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
