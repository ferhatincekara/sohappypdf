import type { ConversionType } from "@repo/conversions";
import { isConversionSupported } from "@repo/conversions";
import { degrees, rgb, StandardFonts } from "pdf-lib";
import type { ConversionEngine } from "../../engine.js";
import { outputFilename, outputMimeType } from "../../engine.js";
import type { ConversionEngineConfig } from "../../engine-config.js";
import { unsupportedConversionError } from "../../errors.js";
import { validateConversionOutput } from "../../output-validation.js";
import { joinJobPath } from "../../workspace/temp-workspace.js";
import { loadPdfDocument, savePdfDocument } from "./pdf-page-operations.js";

const TYPES = [
  "watermark-pdf",
  "page-numbers-pdf",
] as const satisfies readonly ConversionType[];

export function createPdfEditEngine(
  config: ConversionEngineConfig,
): ConversionEngine {
  return {
    name: "pdf-edit",
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
      const outputPath = joinJobPath(input.outputDirectory, "output.pdf");
      const source = await loadPdfDocument(input.sourcePath);
      const font = await source.embedFont(StandardFonts.Helvetica);

      if (input.options.type === "watermark-pdf") {
        const opacity = input.options.opacity ?? 0.25;

        for (const page of source.getPages()) {
          const { width, height } = page.getSize();
          const textWidth = font.widthOfTextAtSize(input.options.text, 48);

          page.drawText(input.options.text, {
            x: (width - textWidth) / 2,
            y: height / 2,
            size: 48,
            font,
            color: rgb(0.4, 0.4, 0.4),
            opacity,
            rotate: degrees(-45),
          });
        }
      } else if (input.options.type === "page-numbers-pdf") {
        const startAt = input.options.startAt ?? 1;

        source.getPages().forEach((page, index) => {
          const { width } = page.getSize();
          const label = String(startAt + index);
          const size = 12;
          const textWidth = font.widthOfTextAtSize(label, size);

          page.drawText(label, {
            x: (width - textWidth) / 2,
            y: 24,
            size,
            font,
            color: rgb(0.2, 0.2, 0.2),
          });
        });
      } else {
        throw unsupportedConversionError();
      }

      await savePdfDocument(source, outputPath);

      await validateConversionOutput({
        outputPath,
        expectedFormat: "pdf",
        maxBytes: config.maxOutputFileSizeBytes,
      });

      return {
        outputPath,
        mimeType: outputMimeType("pdf"),
        filename: outputFilename("pdf"),
      };
    },
  };
}
