import type { ConversionType } from "@repo/conversions";
import { isConversionSupported } from "@repo/conversions";
import type { ConversionEngine } from "../../engine.js";
import { outputFilename, outputMimeType } from "../../engine.js";
import type { ConversionEngineConfig } from "../../engine-config.js";
import { invalidInputError, unsupportedConversionError } from "../../errors.js";
import { validateConversionOutput } from "../../output-validation.js";
import { joinJobPath } from "../../workspace/temp-workspace.js";
import { loadPdfDocument, savePdfDocument } from "./pdf-page-operations.js";

const TYPES = ["pdf-forms"] as const satisfies readonly ConversionType[];

/**
 * Fills existing AcroForm text/checkbox fields. Does not create new widgets.
 */
export function createPdfFormsEngine(
  config: ConversionEngineConfig,
): ConversionEngine {
  return {
    name: "pdf-forms",
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
      if (input.options.type !== "pdf-forms") {
        throw unsupportedConversionError();
      }

      const document = await loadPdfDocument(input.sourcePath);
      const form = document.getForm();
      let filled = 0;

      for (const [name, value] of Object.entries(input.options.fields)) {
        try {
          const field = form.getField(name);
          const fieldType = field.constructor.name;

          if (fieldType.includes("TextField")) {
            form.getTextField(name).setText(value);
            filled += 1;
          } else if (fieldType.includes("CheckBox")) {
            const checkbox = form.getCheckBox(name);
            if (
              value === "true" ||
              value === "1" ||
              value.toLowerCase() === "yes"
            ) {
              checkbox.check();
            } else {
              checkbox.uncheck();
            }
            filled += 1;
          } else if (fieldType.includes("Dropdown")) {
            form.getDropdown(name).select(value);
            filled += 1;
          }
        } catch {
          // Skip unknown / unsupported field types.
        }
      }

      if (filled === 0) {
        throw invalidInputError("No matching PDF form fields were filled");
      }

      if (input.options.flatten === true) {
        form.flatten();
      }

      const outputPath = joinJobPath(input.outputDirectory, "output.pdf");
      await savePdfDocument(document, outputPath);
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
