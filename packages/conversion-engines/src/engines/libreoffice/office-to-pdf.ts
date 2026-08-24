import type { ConversionEngineInput, ConversionEngineResult } from "../../engine.js";
import {
  type LibreOfficeRunContext,
  prepareLibreOfficeDirectories,
  readLibreOfficeOutput,
  runLibreOfficeConvert,
} from "./libreoffice-runner.js";

export async function convertOfficeDocumentToPdf(
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
    convertTo: "pdf",
  });

  return readLibreOfficeOutput(
    outputDir,
    "pdf",
    ctx.config.maxOutputFileSizeBytes,
  );
}
