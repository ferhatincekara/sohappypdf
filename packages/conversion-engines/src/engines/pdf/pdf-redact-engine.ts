import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import type { ConversionType } from "@repo/conversions";
import { isConversionSupported } from "@repo/conversions";
import { PDFDocument, rgb } from "pdf-lib";
import type { ConversionEngine } from "../../engine.js";
import { outputFilename, outputMimeType } from "../../engine.js";
import type { ConversionEngineConfig } from "../../engine-config.js";
import {
  invalidInputError,
  unsupportedConversionError,
} from "../../errors.js";
import { validateConversionOutput } from "../../output-validation.js";
import {
  type RunAllowedCommand,
  runAllowedCommand,
} from "../../process/run-process.js";
import { joinJobPath } from "../../workspace/temp-workspace.js";

const TYPES = ["redact-pdf"] as const satisfies readonly ConversionType[];
const MAX_PAGES = 100;

/**
 * Permanent redaction: rasterize pages so underlying text is destroyed,
 * then paint opaque black rectangles over the requested regions.
 */
export function createPdfRedactEngine(
  config: ConversionEngineConfig,
  options: { runCommand?: RunAllowedCommand } = {},
): ConversionEngine {
  const runCommand = options.runCommand ?? runAllowedCommand;

  return {
    name: "pdf-redact",
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
      if (input.options.type !== "redact-pdf") {
        throw unsupportedConversionError();
      }

      const rasterDir = joinJobPath(input.outputDirectory, "raster");
      await mkdir(rasterDir, { recursive: true });
      const prefix = joinJobPath(rasterDir, "page");

      await runCommand({
        command: config.pdftoppmBin,
        args: ["-png", "-r", "150", input.sourcePath, prefix],
        cwd: input.outputDirectory,
        timeoutMs: config.conversionTimeoutMs,
      });

      const entries = (await readdir(rasterDir))
        .filter((entry) => entry.endsWith(".png"))
        .sort();

      if (entries.length === 0) {
        throw invalidInputError();
      }

      if (entries.length > MAX_PAGES) {
        throw invalidInputError("PDF exceeds the redaction page limit");
      }

      const document = await PDFDocument.create();

      for (const [index, entry] of entries.entries()) {
        const pageNumber = index + 1;
        const imageBytes = await readFile(joinJobPath(rasterDir, entry));
        const image = await document.embedPng(imageBytes);
        const page = document.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });

        const scale = image.width / 612;

        for (const region of input.options.regions) {
          if (region.page !== pageNumber) {
            continue;
          }

          page.drawRectangle({
            x: region.x * scale,
            y: region.y * scale,
            width: region.width * scale,
            height: region.height * scale,
            color: rgb(0, 0, 0),
            borderWidth: 0,
          });
        }
      }

      const outputPath = joinJobPath(input.outputDirectory, "output.pdf");
      await writeFile(outputPath, await document.save());
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
