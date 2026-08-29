import { readFile, writeFile } from "node:fs/promises";
import type { ConversionType } from "@sohappypdf/conversions";
import { isConversionSupported } from "@sohappypdf/conversions";
import type { ConversionEngine } from "../../engine.js";
import { outputFilename, outputMimeType } from "../../engine.js";
import type { ConversionEngineConfig } from "../../engine-config.js";
import { invalidInputError, unsupportedConversionError } from "../../errors.js";
import { validateConversionOutput } from "../../output-validation.js";
import {
  type RunAllowedCommand,
  runAllowedCommand,
} from "../../process/run-process.js";
import { joinJobPath } from "../../workspace/temp-workspace.js";
import { type LayoutSection, layoutPagesToSections } from "./layout-html.js";
import { countLayoutWords, parsePdfLayout } from "./pdf-layout.js";

const TYPES = ["pdf-to-markdown"] as const satisfies readonly ConversionType[];

function sectionToMarkdown(section: LayoutSection): string {
  switch (section.kind) {
    case "heading":
      return `# ${section.text}`;
    case "paragraph":
      return section.text;
    case "list":
      return section.items
        .map((item, index) => `${index + 1}. ${item}`)
        .join("\n");
    case "table": {
      if (section.rows.length === 0) {
        return "";
      }

      const header = section.rows[0] ?? [];
      const body = section.rows.slice(1);
      const separator = header.map(() => "---");
      return [
        `| ${header.join(" | ")} |`,
        `| ${separator.join(" | ")} |`,
        ...body.map((row) => `| ${row.join(" | ")} |`),
      ].join("\n");
    }
  }
}

/**
 * Best-effort Markdown from Poppler layout. Does not preserve pixel-perfect layout.
 */
export function createPdfMarkdownEngine(
  config: ConversionEngineConfig,
  options: { runCommand?: RunAllowedCommand } = {},
): ConversionEngine {
  const runCommand = options.runCommand ?? runAllowedCommand;

  return {
    name: "pdf-markdown",
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
      if (input.options.type !== "pdf-to-markdown") {
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

      const markdown = layoutPagesToSections(pages)
        .map(sectionToMarkdown)
        .filter((part) => part.length > 0)
        .join("\n\n");

      const outputPath = joinJobPath(input.outputDirectory, "output.md");
      await writeFile(outputPath, `${markdown}\n`, "utf8");
      await validateConversionOutput({
        outputPath,
        expectedFormat: "md",
        maxBytes: config.maxOutputFileSizeBytes,
      });

      return {
        outputPath,
        mimeType: outputMimeType("md"),
        filename: outputFilename("md"),
      };
    },
  };
}
