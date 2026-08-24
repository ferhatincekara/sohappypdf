import { readFile, stat, writeFile } from "node:fs/promises";
import type {
  ConversionEngineInput,
  ConversionEngineResult,
} from "../../engine.js";
import { joinJobPath } from "../../workspace/temp-workspace.js";
import { layoutPagesToHtml } from "../pdf/layout-html.js";
import { countLayoutWords, parsePdfLayout } from "../pdf/pdf-layout.js";
import {
  type LibreOfficeRunContext,
  prepareLibreOfficeDirectories,
  readLibreOfficeOutput,
  runLibreOfficeConvert,
} from "./libreoffice-runner.js";

const MAX_LAYOUT_BYTES = 8 * 1024 * 1024;

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
  const layoutPath = joinJobPath(outputDirectory, "layout.html");

  await ctx.runCommand({
    command: ctx.config.pdftotextBin,
    args: ["-bbox-layout", "-enc", "UTF-8", sourcePath, layoutPath],
    cwd: outputDirectory,
    timeoutMs: ctx.config.conversionTimeoutMs,
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

  const htmlPath = joinJobPath(outputDirectory, "document.html");
  await writeFile(htmlPath, layoutPagesToHtml(pages), "utf8");
  return htmlPath;
}
