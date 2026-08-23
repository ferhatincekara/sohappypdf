import type { WorkerConfig } from "@repo/config";
import type { ConversionType } from "@repo/conversions";
import { PermanentConversionError } from "../job-errors.js";
import type { ConversionEngine } from "./conversion-engine.js";
import { createImagePdfEngine } from "./image-pdf-engine.js";
import { createOfficeEngine } from "./office-engine.js";
import { createPdfImageEngine } from "./pdf-image-engine.js";
import { createPdfManipulateEngine } from "./pdf-manipulate-engine.js";
import { createPdfTextEngine } from "./pdf-text-engine.js";

export type EngineRegistry = {
  resolve(type: ConversionType): ConversionEngine;
};

export function createEngineRegistry(config: WorkerConfig): EngineRegistry {
  const engines: readonly ConversionEngine[] = [
    createOfficeEngine(config),
    createPdfImageEngine(config),
    createPdfTextEngine(config),
    createImagePdfEngine(),
    createPdfManipulateEngine(config),
  ];

  return {
    resolve(type) {
      const engine = engines.find((item) => item.canHandle(type));

      if (engine === undefined) {
        throw new PermanentConversionError(
          "unsupported_conversion",
          "Unsupported conversion",
        );
      }

      return engine;
    },
  };
}
