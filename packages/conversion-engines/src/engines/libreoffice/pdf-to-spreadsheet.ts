import { writeFile } from "node:fs/promises";
import type {
  ConversionEngineInput,
  ConversionEngineResult,
} from "../../engine.js";
import { invalidInputError } from "../../errors.js";
import { joinJobPath } from "../../workspace/temp-workspace.js";
import { layoutPagesToSpreadsheetHtml } from "../pdf/layout-html.js";
import {
  type LibreOfficeRunContext,
  prepareLibreOfficeDirectories,
  readLibreOfficeOutput,
  runLibreOfficeConvert,
} from "./libreoffice-runner.js";
import { loadPdfLayoutPages } from "./load-pdf-layout.js";

export async function convertPdfToSpreadsheet(
  ctx: LibreOfficeRunContext,
  input: ConversionEngineInput,
): Promise<ConversionEngineResult> {
  const { profileDirectory, outputDir } = await prepareLibreOfficeDirectories(
    input.outputDirectory,
  );
  const htmlPath = await writeReconstructedSpreadsheetHtml(
    ctx,
    input.sourcePath,
    input.outputDirectory,
  );

  if (htmlPath === undefined) {
    throw invalidInputError(
      "This PDF has no extractable text for a spreadsheet",
    );
  }

  await runLibreOfficeConvert(ctx, {
    profileDirectory,
    outputDir,
    sourcePath: htmlPath,
    convertTo: "xlsx",
    infilter: "HTML (StarCalc)",
  });

  return readLibreOfficeOutput(
    outputDir,
    "xlsx",
    ctx.config.maxOutputFileSizeBytes,
  );
}

async function writeReconstructedSpreadsheetHtml(
  ctx: LibreOfficeRunContext,
  sourcePath: string,
  outputDirectory: string,
): Promise<string | undefined> {
  const pages = await loadPdfLayoutPages(ctx, sourcePath, outputDirectory);

  if (pages === undefined) {
    return undefined;
  }

  const htmlPath = joinJobPath(outputDirectory, "spreadsheet.html");
  await writeFile(htmlPath, layoutPagesToSpreadsheetHtml(pages), "utf8");
  return htmlPath;
}
