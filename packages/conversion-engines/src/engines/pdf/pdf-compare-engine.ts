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

const TYPES = ["compare-pdf"] as const satisfies readonly ConversionType[];

function normalizeLines(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd());
}

function buildUnifiedDiff(left: string[], right: string[]): string {
  const lines: string[] = [
    "--- source.pdf",
    "+++ compare.pdf",
    `@@ text comparison (${left.length} / ${right.length} lines) @@`,
  ];

  const max = Math.max(left.length, right.length);

  for (let index = 0; index < max; index += 1) {
    const a = left[index];
    const b = right[index];

    if (a === b) {
      if (a !== undefined && a.length > 0) {
        lines.push(` ${a}`);
      }
      continue;
    }

    if (a !== undefined) {
      lines.push(`-${a}`);
    }

    if (b !== undefined) {
      lines.push(`+${b}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

/**
 * Line-oriented text comparison via pdftotext. Not a pixel/visual diff.
 */
export function createPdfCompareEngine(
  config: ConversionEngineConfig,
  options: { runCommand?: RunAllowedCommand } = {},
): ConversionEngine {
  const runCommand = options.runCommand ?? runAllowedCommand;

  return {
    name: "pdf-compare",
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
      if (input.options.type !== "compare-pdf") {
        throw unsupportedConversionError();
      }

      const otherPath = input.additionalSourcePaths[0];

      if (otherPath === undefined) {
        throw invalidInputError();
      }

      const leftTextPath = joinJobPath(input.outputDirectory, "left.txt");
      const rightTextPath = joinJobPath(input.outputDirectory, "right.txt");

      await runCommand({
        command: config.pdftotextBin,
        args: ["-enc", "UTF-8", "-layout", input.sourcePath, leftTextPath],
        cwd: input.outputDirectory,
        timeoutMs: config.conversionTimeoutMs,
      });
      await runCommand({
        command: config.pdftotextBin,
        args: ["-enc", "UTF-8", "-layout", otherPath, rightTextPath],
        cwd: input.outputDirectory,
        timeoutMs: config.conversionTimeoutMs,
      });

      const left = normalizeLines(await readFile(leftTextPath, "utf8"));
      const right = normalizeLines(await readFile(rightTextPath, "utf8"));
      const diff = buildUnifiedDiff(left, right);
      const outputPath = joinJobPath(input.outputDirectory, "output.txt");
      await writeFile(outputPath, diff, "utf8");

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
    },
  };
}
