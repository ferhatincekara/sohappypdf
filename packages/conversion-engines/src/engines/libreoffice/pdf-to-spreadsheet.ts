import type { ConversionEngineInput, ConversionEngineResult } from "../../engine.js";
import {
  type LibreOfficeRunContext,
  prepareLibreOfficeDirectories,
  readLibreOfficeOutput,
  runLibreOfficeConvert,
} from "./libreoffice-runner.js";

export async function convertPdfToSpreadsheet(
  ctx: LibreOfficeRunContext,
  input: ConversionEngineInput,
): Promise<ConversionEngineResult> {
  const { profileDirectory, outputDir } = await prepareLibreOfficeDirectories(
    input.outputDirectory,
  );

  await runLibreOfficeConvert(ctx, {
    profileDirectory,
    outputDir,
    sourcePath: input.sourcePath,
    infilter: "calc_pdf_import",
    convertTo: "xlsx",
  });

  return readLibreOfficeOutput(
    outputDir,
    "xlsx",
    ctx.config.maxOutputFileSizeBytes,
  );
}
