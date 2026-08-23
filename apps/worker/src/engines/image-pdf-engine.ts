import { readFile, writeFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { PermanentConversionError } from "../job-errors.js";
import { joinJobPath } from "../temp/job-temp-directory.js";
import type { ConversionEngine } from "./conversion-engine.js";
import { OUTPUT_MIME_TYPES } from "./conversion-engine.js";

export function createImagePdfEngine(): ConversionEngine {
  return {
    name: "image-pdf",
    canHandle(type) {
      return type === "jpg-to-pdf" || type === "png-to-pdf";
    },
    async convert(input) {
      if (input.type !== "jpg-to-pdf" && input.type !== "png-to-pdf") {
        throw new PermanentConversionError(
          "unsupported_conversion",
          "Unsupported conversion",
        );
      }

      const imageBytes = await readFile(input.sourcePath);
      const document = await PDFDocument.create();
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

      const outputPath = joinJobPath(input.outputDirectory, "output.pdf");
      await writeFile(outputPath, await document.save());

      return {
        outputPath,
        mimeType: OUTPUT_MIME_TYPES.pdf,
        filename: "output.pdf",
      };
    },
  };
}
