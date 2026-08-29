import type { ConversionType } from "@sohappypdf/conversions";
import type { ConversionEngine, ConversionEngineQuery } from "./engine.js";
import type { ConversionEngineConfig } from "./engine-config.js";
import { createImagePdfEngine } from "./engines/image/image-pdf-engine.js";
import { createOfficeEngine } from "./engines/libreoffice/office-engine.js";
import { createOfficeOcrEngine } from "./engines/libreoffice/office-ocr-engine.js";
import { createOcrEngine } from "./engines/ocr/ocr-engine.js";
import { createPdfCompareEngine } from "./engines/pdf/pdf-compare-engine.js";
import { createPdfEditEngine } from "./engines/pdf/pdf-edit-engine.js";
import { createPdfExtractEngine } from "./engines/pdf/pdf-extract-engine.js";
import { createPdfImageEngine } from "./engines/pdf/pdf-image-engine.js";
import { createPdfManipulateEngine } from "./engines/pdf/pdf-manipulate-engine.js";
import { createPdfMarkdownEngine } from "./engines/pdf/pdf-markdown-engine.js";
import { createPdfPdfaEngine } from "./engines/pdf/pdf-pdfa-engine.js";
import { createPdfRedactEngine } from "./engines/pdf/pdf-redact-engine.js";
import { createPdfRepairEngine } from "./engines/pdf/pdf-repair-engine.js";
import { createPdfSecurityEngine } from "./engines/pdf/pdf-security-engine.js";
import { createPdfTextEngine } from "./engines/pdf/pdf-text-engine.js";
import { unsupportedConversionError } from "./errors.js";

export type EngineResolveInput = ConversionEngineQuery | ConversionType;

export type EngineRegistry = {
  resolve(query: EngineResolveInput): ConversionEngine;
};

function toResolveQuery(query: EngineResolveInput): {
  type: ConversionType;
  sourceFormat?: ConversionEngineQuery["sourceFormat"];
  targetFormat?: ConversionEngineQuery["targetFormat"];
} {
  if (typeof query === "string") {
    return { type: query };
  }

  return query;
}

export function createEngineRegistry(
  config: ConversionEngineConfig,
): EngineRegistry {
  const engines: readonly ConversionEngine[] = [
    createOfficeEngine(config),
    createOfficeOcrEngine(config),
    createOcrEngine(config),
    createPdfImageEngine(config),
    createPdfTextEngine(config),
    createImagePdfEngine(),
    createPdfManipulateEngine(config),
    createPdfEditEngine(config),
    createPdfSecurityEngine(config),
    createPdfRepairEngine(config),
    createPdfPdfaEngine(config),
    createPdfRedactEngine(config),
    createPdfCompareEngine(config),
    createPdfExtractEngine(config),
    createPdfMarkdownEngine(config),
  ];

  return {
    resolve(query) {
      const request = toResolveQuery(query);
      const engine = engines.find((item) => {
        if (!item.canHandle(request.type)) {
          return false;
        }

        if (
          request.sourceFormat === undefined ||
          request.targetFormat === undefined
        ) {
          return true;
        }

        return item.supports({
          type: request.type,
          sourceFormat: request.sourceFormat,
          targetFormat: request.targetFormat,
        });
      });

      if (engine === undefined) {
        throw unsupportedConversionError();
      }

      return engine;
    },
  };
}
