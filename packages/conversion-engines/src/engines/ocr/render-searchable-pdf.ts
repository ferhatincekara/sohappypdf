import { access, copyFile } from "node:fs/promises";
import type { ConversionEngineConfig } from "../../engine-config.js";
import {
  isPermanentConversionError,
  nativeToolFailureError,
} from "../../errors.js";
import type { RunAllowedCommand } from "../../process/run-process.js";
import { toTesseractLanguage } from "./tesseract-language.js";

export type RenderSearchablePdfInput = {
  config: ConversionEngineConfig;
  runCommand: RunAllowedCommand;
  sourcePath: string;
  outputDirectory: string;
  outputPath: string;
  language: string;
  forceOcr?: boolean;
};

export type RenderSearchablePdfResult = {
  forcedOcr: boolean;
};

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function renderSearchablePdf(
  input: RenderSearchablePdfInput,
): Promise<RenderSearchablePdfResult> {
  const language = toTesseractLanguage(input.language);
  if (language.length === 0) {
    throw nativeToolFailureError("OCR language is required");
  }

  const run = async (forceOcr: boolean): Promise<void> => {
    await input.runCommand({
      command: input.config.ocrMyPdfBin,
      args: [
        forceOcr ? "--force-ocr" : "--skip-text",
        "--optimize",
        "0",
        "--output-type",
        "pdf",
        "-l",
        language,
        input.sourcePath,
        input.outputPath,
      ],
      cwd: input.outputDirectory,
      timeoutMs: input.config.conversionTimeoutMs,
      // OCRmyPDF exits 6 when every page already has a text layer.
      acceptExitCodes: forceOcr ? [0] : [0, 6],
    });
  };

  let forcedOcr = input.forceOcr === true;

  if (forcedOcr) {
    await run(true);
  } else {
    try {
      await run(false);
    } catch (error) {
      if (
        isPermanentConversionError(error) &&
        error.message === "Conversion timed out"
      ) {
        throw error;
      }

      await run(true);
      forcedOcr = true;
    }
  }

  if (!(await pathExists(input.outputPath))) {
    await copyFile(input.sourcePath, input.outputPath);
  }

  return { forcedOcr };
}
