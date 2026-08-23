import type { FileFormat } from "./conversion-format.js";
import { normalizeFileFormat } from "./conversion-format.js";
import type { ConversionType } from "./conversion-type.js";
import { CONVERSION_TYPES } from "./conversion-type.js";

export type ConversionCapability = {
  type: ConversionType;
  sourceFormats: readonly FileFormat[];
  targetFormats: readonly FileFormat[];
  implemented: boolean;
};

const CONVERSION_CAPABILITIES: Record<ConversionType, ConversionCapability> = {
  "pdf-to-word": {
    type: "pdf-to-word",
    sourceFormats: ["pdf"],
    targetFormats: ["docx"],
    implemented: false,
  },
  "pdf-to-excel": {
    type: "pdf-to-excel",
    sourceFormats: ["pdf"],
    targetFormats: ["xlsx"],
    implemented: false,
  },
  "pdf-to-powerpoint": {
    type: "pdf-to-powerpoint",
    sourceFormats: ["pdf"],
    targetFormats: ["pptx"],
    implemented: false,
  },
  "word-to-pdf": {
    type: "word-to-pdf",
    sourceFormats: ["doc", "docx"],
    targetFormats: ["pdf"],
    implemented: false,
  },
  "excel-to-pdf": {
    type: "excel-to-pdf",
    sourceFormats: ["xls", "xlsx"],
    targetFormats: ["pdf"],
    implemented: false,
  },
  "powerpoint-to-pdf": {
    type: "powerpoint-to-pdf",
    sourceFormats: ["ppt", "pptx"],
    targetFormats: ["pdf"],
    implemented: false,
  },
  "pdf-to-jpg": {
    type: "pdf-to-jpg",
    sourceFormats: ["pdf"],
    targetFormats: ["jpg"],
    implemented: false,
  },
  "pdf-to-png": {
    type: "pdf-to-png",
    sourceFormats: ["pdf"],
    targetFormats: ["png"],
    implemented: false,
  },
  "jpg-to-pdf": {
    type: "jpg-to-pdf",
    sourceFormats: ["jpg"],
    targetFormats: ["pdf"],
    implemented: false,
  },
  "png-to-pdf": {
    type: "png-to-pdf",
    sourceFormats: ["png"],
    targetFormats: ["pdf"],
    implemented: false,
  },
  "merge-pdf": {
    type: "merge-pdf",
    sourceFormats: ["pdf"],
    targetFormats: ["pdf"],
    implemented: false,
  },
  "split-pdf": {
    type: "split-pdf",
    sourceFormats: ["pdf"],
    targetFormats: ["pdf"],
    implemented: false,
  },
  "compress-pdf": {
    type: "compress-pdf",
    sourceFormats: ["pdf"],
    targetFormats: ["pdf"],
    implemented: false,
  },
  "rotate-pdf": {
    type: "rotate-pdf",
    sourceFormats: ["pdf"],
    targetFormats: ["pdf"],
    implemented: false,
  },
  "protect-pdf": {
    type: "protect-pdf",
    sourceFormats: ["pdf"],
    targetFormats: ["pdf"],
    implemented: false,
  },
  "unlock-pdf": {
    type: "unlock-pdf",
    sourceFormats: ["pdf"],
    targetFormats: ["pdf"],
    implemented: false,
  },
  "ocr-pdf": {
    type: "ocr-pdf",
    sourceFormats: ["pdf"],
    targetFormats: ["pdf", "txt"],
    implemented: false,
  },
  "ocr-image": {
    type: "ocr-image",
    sourceFormats: ["jpg", "png"],
    targetFormats: ["pdf", "txt"],
    implemented: false,
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
