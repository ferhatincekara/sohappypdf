import { readFile, writeFile } from "node:fs/promises";
import type { ConversionType } from "@repo/conversions";
import { isConversionSupported } from "@repo/conversions";
import type { ConversionEngine } from "../../engine.js";
import { outputFilename, outputMimeType } from "../../engine.js";
import type { ConversionEngineConfig } from "../../engine-config.js";
import {
  invalidInputError,
  unsupportedConversionError,
} from "../../errors.js";
import { validateConversionOutput } from "../../output-validation.js";
import {
  type RunAllowedCommand,
  runAllowedCommand,
} from "../../process/run-process.js";
import { joinJobPath } from "../../workspace/temp-workspace.js";
import { layoutPagesToSections } from "./layout-html.js";
import { countLayoutWords, parsePdfLayout } from "./pdf-layout.js";

const TYPES = ["pdf-extract"] as const satisfies readonly ConversionType[];

/**
 * Extracts structured text/layout (pages, sections). Not images or tables as
 * separate binary assets — tables appear as section rows in JSON.
 */
export function createPdfExtractEngine(
  config: ConversionEngineConfig,
  options: { runCommand?: RunAllowedCommand } = {},
): ConversionEngine {
  const runCommand = options.runCommand ?? runAllowedCommand;

  return {
    name: "pdf-extract",
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
      if (input.options.type !== "pdf-extract") {
        throw unsupportedConversionError();
      }

      const layoutPath = joinJobPath(input.outputDirectory, "layout.html");
      await runCommand({
        command: config.pdftotextBin,
        args: ["-bbox-layout", "-enc", "UTF-8", input.sourcePath, layoutPath],
        cwd: input.outputDirectory,
        timeoutMs: config.conversionTimeoutMs,
      });

      const layoutXml = await readFile(layoutPath, "utf8");
      const pages = parsePdfLayout(layoutXml);

      if (countLayoutWords(pages) === 0) {
        throw invalidInputError("No extractable text was found in the PDF");
      }

      const sections = layoutPagesToSections(pages);

      if (input.targetFormat === "txt") {
        const text = sections
          .map((section) => {
            switch (section.kind) {
              case "heading":
              case "paragraph":
                return section.text;
              case "list":
                return section.items.map((item, index) => `${index + 1}. ${item}`).join("\n");
              case "table":
                return section.rows.map((row) => row.join("\t")).join("\n");
            }
          })
          .join("\n\n");
        const outputPath = joinJobPath(input.outputDirectory, "output.txt");
        await writeFile(outputPath, `${text}\n`, "utf8");
        await validateConversionOutput({
          outputPath,
          expectedFormat: "txt",
          maxBytes: config.maxOutputFileSizeBytes,
        });

        return {
          outputPath,
          mimeType: outputMimeType("txt"),
          filename: outputFilename("txt"),
        };
      }

      const payload = {
        pageCount: pages.length,
        wordCount: countLayoutWords(pages),
        pages: pages.map((page, index) => ({
          page: index + 1,
          width: page.width,
          height: page.height,
        })),
        sections,
      };

      const outputPath = joinJobPath(input.outputDirectory, "output.json");
      await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
      await validateConversionOutput({
        outputPath,
        expectedFormat: "json",
        maxBytes: config.maxOutputFileSizeBytes,
      });

      return {
        outputPath,
        mimeType: outputMimeType("json"),
        filename: outputFilename("json"),
      };
    },
  };
}
