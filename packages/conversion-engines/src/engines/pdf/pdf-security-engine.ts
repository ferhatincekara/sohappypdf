import type { ConversionType } from "@repo/conversions";
import { isConversionSupported } from "@repo/conversions";
import type { ConversionEngine } from "../../engine.js";
import { outputFilename, outputMimeType } from "../../engine.js";
import type { ConversionEngineConfig } from "../../engine-config.js";
import { unsupportedConversionError } from "../../errors.js";
import { validateConversionOutput } from "../../output-validation.js";
import {
  type RunAllowedCommand,
  runAllowedCommand,
} from "../../process/run-process.js";
import {
  assertPathInside,
  joinJobPath,
} from "../../workspace/temp-workspace.js";

const TYPES = [
  "protect-pdf",
  "unlock-pdf",
] as const satisfies readonly ConversionType[];

export function createPdfSecurityEngine(
  config: ConversionEngineConfig,
  options: { runCommand?: RunAllowedCommand } = {},
): ConversionEngine {
  const runCommand = options.runCommand ?? runAllowedCommand;

  return {
    name: "pdf-security",
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
      const safeOutput = assertPathInside(input.outputDirectory, outputPath);

      if (input.options.type === "protect-pdf") {
        await runCommand({
          command: config.qpdfBin,
          args: [
            "--encrypt",
            input.options.password,
            input.options.password,
            "256",
            "--",
            input.sourcePath,
            safeOutput,
          ],
          cwd: input.outputDirectory,
          timeoutMs: config.conversionTimeoutMs,
        });
      } else if (input.options.type === "unlock-pdf") {
        await runCommand({
          command: config.qpdfBin,
          args: [
            `--password=${input.options.password}`,
            "--decrypt",
            input.sourcePath,
            safeOutput,
          ],
          cwd: input.outputDirectory,
          timeoutMs: config.conversionTimeoutMs,
        });
      } else {
        throw unsupportedConversionError();
      }

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
