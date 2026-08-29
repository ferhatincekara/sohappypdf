import { open, stat } from "node:fs/promises";
import type { FileFormat } from "@sohappypdf/conversions";
import { outputValidationError } from "./errors.js";

const MAX_OUTPUT_BYTES = 150 * 1024 * 1024;

export type ValidateConversionOutputInput = {
  outputPath: string;
  expectedFormat: FileFormat;
  maxBytes?: number;
};

function hasPrefix(bytes: Uint8Array, prefix: readonly number[]): boolean {
  if (bytes.length < prefix.length) {
    return false;
  }

  return prefix.every((value, index) => bytes[index] === value);
}

function matchesExpectedFormat(format: FileFormat, bytes: Uint8Array): boolean {
  switch (format) {
    case "pdf":
      return hasPrefix(bytes, [37, 80, 68, 70]);
    case "png":
      return hasPrefix(bytes, [137, 80, 78, 71]);
    case "jpg":
    case "jpeg":
      return hasPrefix(bytes, [255, 216, 255]);
    case "docx":
    case "xlsx":
    case "pptx":
    case "zip":
      return hasPrefix(bytes, [80, 75]);
    case "txt":
    case "md":
    case "json":
      return bytes.length > 0;
    default:
      return bytes.length > 0;
  }
}

export async function validateConversionOutput(
  input: ValidateConversionOutputInput,
): Promise<{ sizeBytes: number }> {
  const maxBytes = input.maxBytes ?? MAX_OUTPUT_BYTES;

  try {
    const outputStat = await stat(input.outputPath);

    if (outputStat.size < 1) {
      throw outputValidationError();
    }

    if (outputStat.size > maxBytes) {
      throw outputValidationError("Output file exceeds the worker size limit");
    }

    const handle = await open(input.outputPath, "r");
    const header = Buffer.alloc(16);

    try {
      await handle.read(header, 0, header.byteLength, 0);
    } finally {
      await handle.close();
    }

    const bytes = new Uint8Array(header);

    if (!matchesExpectedFormat(input.expectedFormat, bytes)) {
      throw outputValidationError("Conversion produced an invalid output file");
    }

    if (!input.outputPath.endsWith(`.${input.expectedFormat}`)) {
      throw outputValidationError("Conversion produced an invalid output file");
    }

    return { sizeBytes: outputStat.size };
  } catch (error) {
    if (error instanceof Error && error.name === "PermanentConversionError") {
      throw error;
    }

    throw outputValidationError();
  }
}
