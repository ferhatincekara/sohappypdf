import type { FileFormat } from "./conversion-format.js";
import { normalizeFileFormat } from "./conversion-format.js";
import type { ConversionType } from "./conversion-type.js";
import { CONVERSION_TYPES } from "./conversion-type.js";

export type ConversionCapability = {
  type: ConversionType;
  sourceFormats: readonly FileFormat[];
  targetFormats: readonly FileFormat[];
  implemented: boolean;
  /** When true, type must be requested explicitly (not auto-resolved from formats). */
  requiresExplicitType?: boolean;
};

const CONVERSION_CAPABILITIES: Record<ConversionType, ConversionCapability> = {
  "pdf-to-word": {
    type: "pdf-to-word",
    sourceFormats: ["pdf"],
    targetFormats: ["docx"],
    implemented: true,
  },
  "pdf-to-word-ocr": {
    type: "pdf-to-word-ocr",
    sourceFormats: ["pdf"],
    targetFormats: ["docx"],
    implemented: true,
    requiresExplicitType: true,
  },
  "pdf-to-excel": {
    type: "pdf-to-excel",
    sourceFormats: ["pdf"],
    targetFormats: ["xlsx"],
    implemented: true,
  },
  "pdf-to-excel-ocr": {
    type: "pdf-to-excel-ocr",
    sourceFormats: ["pdf"],
    targetFormats: ["xlsx"],
    implemented: true,
    requiresExplicitType: true,
  },
  "pdf-to-powerpoint": {
    type: "pdf-to-powerpoint",
    sourceFormats: ["pdf"],
    targetFormats: ["pptx"],
    implemented: true,
  },
  "word-to-pdf": {
    type: "word-to-pdf",
    sourceFormats: ["doc", "docx"],
    targetFormats: ["pdf"],
    implemented: true,
  },
  "excel-to-pdf": {
    type: "excel-to-pdf",
    sourceFormats: ["xls", "xlsx"],
    targetFormats: ["pdf"],
    implemented: true,
  },
  "powerpoint-to-pdf": {
    type: "powerpoint-to-pdf",
    sourceFormats: ["ppt", "pptx"],
    targetFormats: ["pdf"],
    implemented: true,
  },
  "office-to-pdf": {
    type: "office-to-pdf",
    sourceFormats: ["doc", "docx", "xls", "xlsx", "ppt", "pptx"],
    targetFormats: ["pdf"],
    implemented: true,
  },
  "pdf-to-jpg": {
    type: "pdf-to-jpg",
    sourceFormats: ["pdf"],
    targetFormats: ["jpg"],
    implemented: true,
  },
  "pdf-to-png": {
    type: "pdf-to-png",
    sourceFormats: ["pdf"],
    targetFormats: ["png"],
    implemented: true,
  },
  "pdf-to-txt": {
    type: "pdf-to-txt",
    sourceFormats: ["pdf"],
    targetFormats: ["txt"],
    implemented: true,
  },
  "jpg-to-pdf": {
    type: "jpg-to-pdf",
    sourceFormats: ["jpg"],
    targetFormats: ["pdf"],
    implemented: true,
  },
  "png-to-pdf": {
    type: "png-to-pdf",
    sourceFormats: ["png"],
    targetFormats: ["pdf"],
    implemented: true,
  },
  "merge-pdf": {
    type: "merge-pdf",
    sourceFormats: ["pdf"],
    targetFormats: ["pdf"],
    implemented: true,
    requiresExplicitType: true,
  },
  "split-pdf": {
    type: "split-pdf",
    sourceFormats: ["pdf"],
    targetFormats: ["pdf"],
    implemented: true,
  },
  "extract-pages": {
    type: "extract-pages",
    sourceFormats: ["pdf"],
    targetFormats: ["pdf"],
    implemented: true,
    requiresExplicitType: true,
  },
  "compress-pdf": {
    type: "compress-pdf",
    sourceFormats: ["pdf"],
    targetFormats: ["pdf"],
    implemented: true,
  },
  "rotate-pdf": {
    type: "rotate-pdf",
    sourceFormats: ["pdf"],
    targetFormats: ["pdf"],
    implemented: true,
  },
  "organize-pdf": {
    type: "organize-pdf",
    sourceFormats: ["pdf"],
    targetFormats: ["pdf"],
    implemented: true,
  },
  "remove-pages": {
    type: "remove-pages",
    sourceFormats: ["pdf"],
    targetFormats: ["pdf"],
    implemented: true,
  },
  "reorder-pages": {
    type: "reorder-pages",
    sourceFormats: ["pdf"],
    targetFormats: ["pdf"],
    implemented: true,
  },
  "crop-pdf": {
    type: "crop-pdf",
    sourceFormats: ["pdf"],
    targetFormats: ["pdf"],
    implemented: true,
  },
  "repair-pdf": {
    type: "repair-pdf",
    sourceFormats: ["pdf"],
    targetFormats: ["pdf"],
    implemented: true,
  },
  "pdf-to-pdfa": {
    type: "pdf-to-pdfa",
    sourceFormats: ["pdf"],
    targetFormats: ["pdf"],
    implemented: true,
  },
  "watermark-pdf": {
    type: "watermark-pdf",
    sourceFormats: ["pdf"],
    targetFormats: ["pdf"],
    implemented: true,
  },
  "page-numbers-pdf": {
    type: "page-numbers-pdf",
    sourceFormats: ["pdf"],
    targetFormats: ["pdf"],
    implemented: true,
  },
  "edit-pdf": {
    type: "edit-pdf",
    sourceFormats: ["pdf"],
    targetFormats: ["pdf"],
    implemented: true,
  },
  "protect-pdf": {
    type: "protect-pdf",
    sourceFormats: ["pdf"],
    targetFormats: ["pdf"],
    implemented: true,
  },
  "unlock-pdf": {
    type: "unlock-pdf",
    sourceFormats: ["pdf"],
    targetFormats: ["pdf"],
    implemented: true,
  },
  "sign-pdf": {
    type: "sign-pdf",
    sourceFormats: ["pdf"],
    targetFormats: ["pdf"],
    implemented: true,
  },
  "redact-pdf": {
    type: "redact-pdf",
    sourceFormats: ["pdf"],
    targetFormats: ["pdf"],
    implemented: true,
  },
  "compare-pdf": {
    type: "compare-pdf",
    sourceFormats: ["pdf"],
    targetFormats: ["txt"],
    implemented: true,
    requiresExplicitType: true,
  },
  "pdf-forms": {
    type: "pdf-forms",
    sourceFormats: ["pdf"],
    targetFormats: ["pdf"],
    implemented: false,
  },
  "scan-to-pdf": {
    type: "scan-to-pdf",
    sourceFormats: ["jpg", "png"],
    targetFormats: ["pdf"],
    implemented: true,
    requiresExplicitType: true,
  },
  "pdf-extract": {
    type: "pdf-extract",
    sourceFormats: ["pdf"],
    targetFormats: ["txt", "json"],
    implemented: true,
    requiresExplicitType: true,
  },
  "pdf-to-markdown": {
    type: "pdf-to-markdown",
    sourceFormats: ["pdf"],
    targetFormats: ["md"],
    implemented: true,
  },
  "ocr-pdf": {
    type: "ocr-pdf",
    sourceFormats: ["pdf"],
    targetFormats: ["pdf", "txt"],
    implemented: true,
    requiresExplicitType: true,
  },
  "ocr-image": {
    type: "ocr-image",
    sourceFormats: ["jpg", "png"],
    targetFormats: ["pdf", "txt"],
    implemented: false,
  },
  "ai-summarizer": {
    type: "ai-summarizer",
    sourceFormats: ["pdf"],
    targetFormats: ["txt", "md"],
    implemented: false,
    requiresExplicitType: true,
  },
  "translate-pdf": {
    type: "translate-pdf",
    sourceFormats: ["pdf"],
    targetFormats: ["pdf", "txt"],
    implemented: false,
    requiresExplicitType: true,
  },
};

export function listConversionCapabilities(): readonly ConversionCapability[] {
  return CONVERSION_TYPES.map((type) => CONVERSION_CAPABILITIES[type]);
}

export function getConversionCapability(
  type: ConversionType,
): ConversionCapability {
  return CONVERSION_CAPABILITIES[type];
}

export function isConversionImplemented(type: ConversionType): boolean {
  return CONVERSION_CAPABILITIES[type].implemented;
}

export function isSourceFormatAccepted(
  type: ConversionType,
  sourceFormat: FileFormat,
): boolean {
  const format = normalizeFileFormat(sourceFormat) ?? sourceFormat;
  return CONVERSION_CAPABILITIES[type].sourceFormats.includes(format);
}

export function isTargetFormatAccepted(
  type: ConversionType,
  targetFormat: FileFormat,
): boolean {
  const format = normalizeFileFormat(targetFormat) ?? targetFormat;
  return CONVERSION_CAPABILITIES[type].targetFormats.includes(format);
}

export function isConversionSupported(
  type: ConversionType,
  sourceFormat: FileFormat,
  targetFormat: FileFormat,
): boolean {
  return (
    isSourceFormatAccepted(type, sourceFormat) &&
    isTargetFormatAccepted(type, targetFormat)
  );
}

export function findConversionTypes(
  sourceFormat: FileFormat,
  targetFormat: FileFormat,
): ConversionType[] {
  return listConversionCapabilities()
    .filter((capability) =>
      isConversionSupported(capability.type, sourceFormat, targetFormat),
    )
    .map((capability) => capability.type);
}

export function findImplementedConversionTypes(
  sourceFormat: FileFormat,
  targetFormat: FileFormat,
): ConversionType[] {
  return findConversionTypes(sourceFormat, targetFormat).filter((type) => {
    const capability = getConversionCapability(type);
    return capability.implemented && capability.requiresExplicitType !== true;
  });
}
