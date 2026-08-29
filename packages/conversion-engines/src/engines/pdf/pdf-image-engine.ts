import { readdir, readFile, rename } from "node:fs/promises";
import { basename } from "node:path";
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
import { writeZipArchive } from "../../workspace/write-zip.js";

const TYPES = [
  "pdf-to-jpg",
  "pdf-to-png",
] as const satisfies readonly ConversionType[];

function pageIndexFromName(
  name: string,
  prefix: string,
  format: string,
): number {
  const suffix = `.${format}`;

  if (!name.startsWith(`${prefix}-`) || !name.endsWith(suffix)) {
    return Number.NaN;
  }

  return Number.parseInt(name.slice(prefix.length + 1, -suffix.length), 10);
}

async function collectRenderedPages(
  directory: string,
  prefix: string,
  format: "jpg" | "png",
): Promise<string[]> {
  const names = await readdir(directory);
  return names
    .map((name) => ({
      name,
      page: pageIndexFromName(name, prefix, format),
    }))
    .filter((entry) => Number.isInteger(entry.page) && entry.page > 0)
    .sort((left, right) => left.page - right.page)
    .map((entry) => joinJobPath(directory, entry.name));
}

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
      const page = input.options.page;
      const dpi = input.options.dpi ?? 150;
      const prefix = joinJobPath(input.outputDirectory, "page");
      const args = [format === "jpg" ? "-jpeg" : "-png", "-r", String(dpi)];

      if (page !== undefined) {
        args.push("-singlefile", "-f", String(page), "-l", String(page));
      }

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

      if (page !== undefined) {
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
      }

      const rendered = await collectRenderedPages(
        input.outputDirectory,
        "page",
        format,
      );

      if (rendered.length === 0) {
        throw new PermanentConversionError(
          "output_invalid",
          "Conversion produced an invalid output file",
        );
      }

      if (rendered.length === 1) {
        const only = rendered[0];

        if (only === undefined) {
          throw new PermanentConversionError(
            "output_invalid",
            "Conversion produced an invalid output file",
          );
        }

        const outputPath = joinJobPath(
          input.outputDirectory,
          outputFilename(format),
        );
        await rename(only, outputPath);
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
      }

      const outputPath = joinJobPath(input.outputDirectory, "output.zip");
      await writeZipArchive(
        outputPath,
        await Promise.all(
          rendered.map(async (path, index) => ({
            name: `${basename(prefix)}-${index + 1}.${format}`,
            data: await readFile(path),
          })),
        ),
      );
      await validateConversionOutput({
        outputPath,
        expectedFormat: "zip",
        maxBytes: config.maxOutputFileSizeBytes,
      });

      return {
        outputPath,
        mimeType: outputMimeType("zip"),
        filename: outputFilename("zip"),
      } satisfies ConversionEngineResult;
    },
  };
}
