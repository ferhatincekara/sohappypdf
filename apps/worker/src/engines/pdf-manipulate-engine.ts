import { readFile, writeFile } from "node:fs/promises";
import type { WorkerConfig } from "@repo/config";
import type { CompressionLevel } from "@repo/conversions";
import { PDFDocument } from "pdf-lib";
import { PermanentConversionError } from "../job-errors.js";
import { runAllowedCommand } from "../process/run-command.js";
import { joinJobPath } from "../temp/job-temp-directory.js";
import type { ConversionEngine } from "./conversion-engine.js";
import { OUTPUT_MIME_TYPES } from "./conversion-engine.js";

const GHOSTSCRIPT_QUALITY: Record<CompressionLevel, string> = {
  low: "/printer",
  medium: "/ebook",
  high: "/screen",
};

export function createPdfManipulateEngine(
  config: WorkerConfig,
): ConversionEngine {
  return {
    name: "pdf-manipulate",
    canHandle(type) {
      return (
        type === "merge-pdf" || type === "split-pdf" || type === "compress-pdf"
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
      } else if (input.options.type === "compress-pdf") {
        await compressPdf({
          config,
          sourcePath: input.sourcePath,
          outputPath,
          cwd: input.outputDirectory,
          level: input.options.level,
        });
      } else {
        throw new PermanentConversionError(
          "unsupported_conversion",
          "Unsupported conversion",
        );
      }

      return {
        outputPath,
        mimeType: OUTPUT_MIME_TYPES.pdf,
        filename: "output.pdf",
      };
    },
  };
}

async function loadPdf(path: string): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(await readFile(path));
  } catch {
    throw new PermanentConversionError(
      "processing_failed",
      "Invalid source file",
    );
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
        throw new PermanentConversionError(
          "processing_failed",
          "Invalid source file",
        );
      }

      output.addPage(page);
    }
  }

  await writeFile(outputPath, await output.save());
}

async function compressPdf(input: {
  config: WorkerConfig;
  sourcePath: string;
  outputPath: string;
  cwd: string;
  level: CompressionLevel;
}): Promise<void> {
  await runAllowedCommand({
    command: input.config.ghostscriptBin,
    args: [
      "-dSAFER",
      "-dBATCH",
      "-dNOPAUSE",
      "-dQUIET",
      "-sDEVICE=pdfwrite",
      "-dCompatibilityLevel=1.4",
      `-dPDFSETTINGS=${GHOSTSCRIPT_QUALITY[input.level]}`,
      `-sOutputFile=${input.outputPath}`,
      input.sourcePath,
    ],
    cwd: input.cwd,
    timeoutMs: input.config.conversionTimeoutMs,
  });
}
