import { readFile } from "node:fs/promises";
import type { ConversionType } from "@sohappypdf/conversions";
import { isConversionSupported } from "@sohappypdf/conversions";
import { degrees, rgb, StandardFonts } from "pdf-lib";
import type { ConversionEngine } from "../../engine.js";
import { outputFilename, outputMimeType } from "../../engine.js";
import type { ConversionEngineConfig } from "../../engine-config.js";
import { invalidInputError, unsupportedConversionError } from "../../errors.js";
import { validateConversionOutput } from "../../output-validation.js";
import { joinJobPath } from "../../workspace/temp-workspace.js";
import { loadPdfDocument, savePdfDocument } from "./pdf-page-operations.js";

const TYPES = [
  "watermark-pdf",
  "page-numbers-pdf",
  "edit-pdf",
  "sign-pdf",
] as const satisfies readonly ConversionType[];

/**
 * Overlay editing only:
 * - watermark / page numbers
 * - edit-pdf: text stamps, filled/highlight rectangles, optional image stamp
 * - sign-pdf: visual signature image or text stamp (not cryptographic)
 */
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
      const pages = source.getPages();

      if (input.options.type === "watermark-pdf") {
        const opacity = input.options.opacity ?? 0.25;

        for (const page of pages) {
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

        pages.forEach((page, index) => {
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
      } else if (input.options.type === "edit-pdf") {
        let stampImage:
          | Awaited<ReturnType<typeof source.embedPng>>
          | Awaited<ReturnType<typeof source.embedJpg>>
          | undefined;

        if (input.additionalSourcePaths[0] !== undefined) {
          const bytes = await readFile(input.additionalSourcePaths[0]);
          try {
            stampImage = await source.embedPng(bytes);
          } catch {
            try {
              stampImage = await source.embedJpg(bytes);
            } catch {
              throw invalidInputError();
            }
          }
        }

        for (const operation of input.options.operations) {
          const page = pages[operation.page - 1];

          if (page === undefined) {
            throw invalidInputError(
              "Edit operation references an invalid page",
            );
          }

          if (operation.kind === "text") {
            page.drawText(operation.text, {
              x: operation.x,
              y: operation.y,
              size: operation.size ?? 12,
              font,
              color: rgb(0, 0, 0),
            });
          } else if (operation.kind === "rectangle") {
            const highlight = operation.style === "highlight";
            page.drawRectangle({
              x: operation.x,
              y: operation.y,
              width: operation.width,
              height: operation.height,
              color: highlight ? rgb(1, 1, 0) : rgb(0, 0, 0),
              opacity: highlight ? 0.35 : 1,
              borderWidth: 0,
            });
          } else if (operation.kind === "image") {
            if (stampImage === undefined) {
              throw invalidInputError(
                "Image edit requires an additional image file",
              );
            }

            page.drawImage(stampImage, {
              x: operation.x,
              y: operation.y,
              width: operation.width,
              height: operation.height,
            });
          }
        }
      } else if (input.options.type === "sign-pdf") {
        const page = pages[input.options.page - 1];

        if (page === undefined) {
          throw invalidInputError("Signature page is out of range");
        }

        const signaturePath = input.additionalSourcePaths[0];

        if (signaturePath !== undefined) {
          const bytes = await readFile(signaturePath);
          let image:
            | Awaited<ReturnType<typeof source.embedPng>>
            | Awaited<ReturnType<typeof source.embedJpg>>;

          try {
            image = await source.embedPng(bytes);
          } catch {
            try {
              image = await source.embedJpg(bytes);
            } catch {
              throw invalidInputError();
            }
          }

          page.drawImage(image, {
            x: input.options.x,
            y: input.options.y,
            width: input.options.width,
            height: input.options.height,
          });
        } else if (input.options.text !== undefined) {
          page.drawText(input.options.text, {
            x: input.options.x,
            y: input.options.y,
            size: Math.min(input.options.height, 24),
            font,
            color: rgb(0.1, 0.1, 0.45),
          });
        } else {
          throw invalidInputError();
        }
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
