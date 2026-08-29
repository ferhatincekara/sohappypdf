import { readFile, writeFile } from "node:fs/promises";
import type { CompressionLevel } from "@sohappypdf/conversions";
import {
  type ConversionType,
  isConversionSupported,
} from "@sohappypdf/conversions";
import { PDFDocument } from "pdf-lib";
import type { ConversionEngine } from "../../engine.js";
import { outputFilename, outputMimeType } from "../../engine.js";
import type { ConversionEngineConfig } from "../../engine-config.js";
import {
  invalidInputError,
  PermanentConversionError,
  unsupportedConversionError,
} from "../../errors.js";
import { validateConversionOutput } from "../../output-validation.js";
import {
  type RunAllowedCommand,
  runAllowedCommand,
} from "../../process/run-process.js";
import {
  assertPathInside,
  joinJobPath,
} from "../../workspace/temp-workspace.js";
import {
  cropPdfMargins,
  organizePdfPages,
  removePdfPages,
  reorderPdfPages,
  rotatePdfPages,
} from "./pdf-page-operations.js";

const TYPES = [
  "merge-pdf",
  "split-pdf",
  "extract-pages",
  "compress-pdf",
  "rotate-pdf",
  "organize-pdf",
  "remove-pages",
  "reorder-pages",
  "crop-pdf",
] as const satisfies readonly ConversionType[];

const GHOSTSCRIPT_QUALITY: Record<CompressionLevel, string> = {
  low: "/printer",
  medium: "/ebook",
  high: "/screen",
};

export function createPdfManipulateEngine(
  config: ConversionEngineConfig,
  options: { runCommand?: RunAllowedCommand } = {},
): ConversionEngine {
  const runCommand = options.runCommand ?? runAllowedCommand;

  return {
    name: "pdf-manipulate",
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
      const outputPath = joinJobPath(input.outputDirectory, "output.pdf");

      if (input.options.type === "merge-pdf") {
        await mergePdfs(
          [input.sourcePath, ...input.additionalSourcePaths],
          outputPath,
        );
      } else if (input.options.type === "split-pdf") {
        await splitPdf(input.sourcePath, input.options.ranges, outputPath);
      } else if (input.options.type === "extract-pages") {
        if (
          input.options.pages !== undefined &&
          input.options.pages.length > 0
        ) {
          await removePdfPages({
            sourcePath: input.sourcePath,
            outputPath,
            pagesToRemove: input.options.pages,
          });
        } else {
          await splitPdf(input.sourcePath, input.options.ranges, outputPath);
        }
      } else if (input.options.type === "compress-pdf") {
        await compressPdf({
          config,
          runCommand,
          sourcePath: input.sourcePath,
          outputPath,
          cwd: input.outputDirectory,
          level: input.options.level,
        });
      } else if (input.options.type === "rotate-pdf") {
        await rotatePdfPages({
          sourcePath: input.sourcePath,
          outputPath,
          degrees: input.options.degrees,
          pages: input.options.pages,
        });
      } else if (input.options.type === "organize-pdf") {
        await organizePdfPages({
          sourcePath: input.sourcePath,
          outputPath,
          order: input.options.order,
          rotations: input.options.rotations,
        });
      } else if (input.options.type === "reorder-pages") {
        await reorderPdfPages({
          sourcePath: input.sourcePath,
          outputPath,
          order: input.options.order,
        });
      } else if (input.options.type === "remove-pages") {
        await removePdfPages({
          sourcePath: input.sourcePath,
          outputPath,
          pagesToRemove: input.options.pages,
        });
      } else if (input.options.type === "crop-pdf") {
        await cropPdfMargins({
          sourcePath: input.sourcePath,
          outputPath,
          marginTop: input.options.marginTop,
          marginRight: input.options.marginRight,
          marginBottom: input.options.marginBottom,
          marginLeft: input.options.marginLeft,
        });
      } else {
        throw unsupportedConversionError();
      }

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

async function loadPdf(path: string): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(await readFile(path));
  } catch {
    throw invalidInputError();
  }
}

async function mergePdfs(
  sourcePaths: readonly string[],
  outputPath: string,
): Promise<void> {
  const output = await PDFDocument.create();

  for (const sourcePath of sourcePaths) {
    const source = await loadPdf(sourcePath);
    const pages = await output.copyPages(source, source.getPageIndices());

    for (const page of pages) {
      output.addPage(page);
    }
  }

  await writeFile(outputPath, await output.save());
}

async function splitPdf(
  sourcePath: string,
  ranges: readonly { start: number; end: number }[] | undefined,
  outputPath: string,
): Promise<void> {
  const source = await loadPdf(sourcePath);
  const output = await PDFDocument.create();
  const pageCount = source.getPageCount();
  const selected = ranges ?? [{ start: 1, end: pageCount }];

  for (const range of selected) {
    for (
      let pageNumber = range.start;
      pageNumber <= range.end;
      pageNumber += 1
    ) {
      if (pageNumber < 1 || pageNumber > pageCount) {
        throw new PermanentConversionError(
          "invalid_options",
          "Invalid conversion options",
        );
      }

      const [page] = await output.copyPages(source, [pageNumber - 1]);

      if (page === undefined) {
        throw invalidInputError();
      }

      output.addPage(page);
    }
  }

  await writeFile(outputPath, await output.save());
}

async function compressPdf(input: {
  config: ConversionEngineConfig;
  runCommand: RunAllowedCommand;
  sourcePath: string;
  outputPath: string;
  cwd: string;
  level: CompressionLevel;
}): Promise<void> {
  const outputPath = assertPathInside(input.cwd, input.outputPath);

  await input.runCommand({
    command: input.config.ghostscriptBin,
    args: [
      "-dSAFER",
      "-dBATCH",
      "-dNOPAUSE",
      "-dQUIET",
      "-sDEVICE=pdfwrite",
      "-dCompatibilityLevel=1.4",
      `-dPDFSETTINGS=${GHOSTSCRIPT_QUALITY[input.level]}`,
      `-sOutputFile=${outputPath}`,
      input.sourcePath,
    ],
    cwd: input.cwd,
    timeoutMs: input.config.conversionTimeoutMs,
  });
}
