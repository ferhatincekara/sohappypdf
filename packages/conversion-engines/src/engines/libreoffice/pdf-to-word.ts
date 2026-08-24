import { writeFile } from "node:fs/promises";
import type {
  ConversionEngineInput,
  ConversionEngineResult,
} from "../../engine.js";
import { joinJobPath } from "../../workspace/temp-workspace.js";
import { layoutPagesToHtml } from "../pdf/layout-html.js";
import {
  type LibreOfficeRunContext,
  prepareLibreOfficeDirectories,
  readLibreOfficeOutput,
  runLibreOfficeConvert,
} from "./libreoffice-runner.js";
import { loadPdfLayoutPages } from "./load-pdf-layout.js";

export async function convertPdfToWord(
  ctx: LibreOfficeRunContext,
  input: ConversionEngineInput,
): Promise<ConversionEngineResult> {
  const { profileDirectory, outputDir } = await prepareLibreOfficeDirectories(
    input.outputDirectory,
  );

  const htmlPath = await writeReconstructedHtml(
    ctx,
    input.sourcePath,
    input.outputDirectory,
  );

  await runLibreOfficeConvert(ctx, {
    profileDirectory,
    outputDir,
    sourcePath: htmlPath === undefined ? input.sourcePath : htmlPath,
    convertTo: htmlPath === undefined ? "docx" : "docx:Office Open XML Text",
    infilter:
      htmlPath === undefined ? "writer_pdf_import" : "HTML (StarWriter)",
  });

  return readLibreOfficeOutput(
    outputDir,
    "docx",
    ctx.config.maxOutputFileSizeBytes,
  );
}

async function writeReconstructedHtml(
  ctx: LibreOfficeRunContext,
  sourcePath: string,
  outputDirectory: string,
): Promise<string | undefined> {
  const pages = await loadPdfLayoutPages(ctx, sourcePath, outputDirectory);

  if (pages === undefined) {
    return undefined;
  }

  const htmlPath = joinJobPath(outputDirectory, "document.html");
  await writeFile(htmlPath, layoutPagesToHtml(pages), "utf8");
  return htmlPath;
}
