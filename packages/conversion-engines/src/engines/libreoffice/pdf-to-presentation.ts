import type { ConversionEngineInput, ConversionEngineResult } from "../../engine.js";
import {
  type LibreOfficeRunContext,
  prepareLibreOfficeDirectories,
  readLibreOfficeOutput,
  runLibreOfficeConvert,
} from "./libreoffice-runner.js";

export async function convertPdfToPresentation(
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
    infilter: "impress_pdf_import",
    convertTo: "pptx",
  });

  return readLibreOfficeOutput(
    outputDir,
    "pptx",
    ctx.config.maxOutputFileSizeBytes,
  );
}
