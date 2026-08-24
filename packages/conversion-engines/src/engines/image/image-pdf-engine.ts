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
  "scan-to-pdf",
] as const satisfies readonly ConversionType[];

const MAX_SCAN_IMAGES = 50;

async function embedImage(
  document: PDFDocument,
  bytes: Buffer,
  hint: "jpg" | "png" | "auto",
) {
  if (hint === "jpg") {
    return document.embedJpg(bytes);
  }

  if (hint === "png") {
    return document.embedPng(bytes);
  }

  try {
    return await document.embedPng(bytes);
  } catch {
    return document.embedJpg(bytes);
  }
}

function extensionHint(path: string): "jpg" | "png" | "auto" {
  if (path.endsWith(".png")) {
    return "png";
  }

  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) {
    return "jpg";
  }

  return "auto";
}

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
      if (
        input.type !== "jpg-to-pdf" &&
        input.type !== "png-to-pdf" &&
        input.type !== "scan-to-pdf"
      ) {
        throw unsupportedConversionError();
      }

      const paths =
        input.type === "scan-to-pdf"
          ? [input.sourcePath, ...input.additionalSourcePaths]
          : [input.sourcePath];

      if (paths.length > MAX_SCAN_IMAGES) {
        throw invalidInputError("Too many scan images");
      }

      const document = await PDFDocument.create();

      try {
        for (const path of paths) {
          const imageBytes = await readFile(path);
          const hint =
            input.type === "jpg-to-pdf"
              ? "jpg"
              : input.type === "png-to-pdf"
                ? "png"
                : extensionHint(path);
          const image = await embedImage(document, imageBytes, hint);
          const page = document.addPage([image.width, image.height]);
          page.drawImage(image, {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height,
          });
        }
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
