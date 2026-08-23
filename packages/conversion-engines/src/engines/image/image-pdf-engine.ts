import { readFile, writeFile } from "node:fs/promises";
import { type ConversionType, isConversionSupported } from "@repo/conversions";
import { PDFDocument } from "pdf-lib";
import type { ConversionEngine } from "../../engine.js";
import { outputFilename, outputMimeType } from "../../engine.js";
import { invalidInputError, unsupportedConversionError } from "../../errors.js";
import { validateConversionOutput } from "../../output-validation.js";
import { joinJobPath } from "../../workspace/temp-workspace.js";

const TYPES = [
  "jpg-to-pdf",
  "png-to-pdf",
] as const satisfies readonly ConversionType[];

export function createImagePdfEngine(): ConversionEngine {
  return {
    name: "image-pdf",
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
      if (input.type !== "jpg-to-pdf" && input.type !== "png-to-pdf") {
        throw unsupportedConversionError();
      }

      const imageBytes = await readFile(input.sourcePath);
      const document = await PDFDocument.create();

      try {
        const image =
          input.type === "jpg-to-pdf"
            ? await document.embedJpg(imageBytes)
            : await document.embedPng(imageBytes);
        const page = document.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      } catch {
        throw invalidInputError();
      }

      const outputPath = joinJobPath(input.outputDirectory, "output.pdf");
      await writeFile(outputPath, await document.save());
      await validateConversionOutput({
        outputPath,
        expectedFormat: "pdf",
      });

      return {
        outputPath,
        mimeType: outputMimeType("pdf"),
        filename: outputFilename("pdf"),
      };
    },
  };
}
