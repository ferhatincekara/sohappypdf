/**
 * Client-safe mirror of implemented conversion capabilities that the HTTP
 * create endpoint can enqueue with default options.
 * Do not import `@repo/conversions` in browser code.
 *
 * merge-pdf is implemented in the worker but omitted here: the API create
 * contract does not accept options, and merge requires additionalFileIds.
 */
import type {
  ConversionSourceFormat,
  ConversionTargetFormat,
  ConversionType,
} from "../types/conversion";

export type CreatableConversionCapability = {
  type: ConversionType;
  sourceFormats: readonly ConversionSourceFormat[];
  targetFormats: readonly ConversionTargetFormat[];
};

const CREATABLE_CONVERSIONS: readonly CreatableConversionCapability[] = [
  {
    type: "pdf-to-word",
    sourceFormats: ["pdf"],
    targetFormats: ["docx"],
  },
  {
    type: "pdf-to-jpg",
    sourceFormats: ["pdf"],
    targetFormats: ["jpg"],
  },
  {
    type: "pdf-to-png",
    sourceFormats: ["pdf"],
    targetFormats: ["png"],
  },
  {
    type: "pdf-to-txt",
    sourceFormats: ["pdf"],
    targetFormats: ["txt"],
  },
  {
    type: "jpg-to-pdf",
    sourceFormats: ["jpg"],
    targetFormats: ["pdf"],
  },
  {
    type: "png-to-pdf",
    sourceFormats: ["png"],
    targetFormats: ["pdf"],
  },
  {
    type: "split-pdf",
    sourceFormats: ["pdf"],
    targetFormats: ["pdf"],
  },
  {
    type: "compress-pdf",
    sourceFormats: ["pdf"],
    targetFormats: ["pdf"],
  },
];

export function listCreatableConversions(): readonly CreatableConversionCapability[] {
  return CREATABLE_CONVERSIONS;
}

export function listCreatableConversionTypes(
  sourceFormat: ConversionSourceFormat,
  targetFormat: ConversionTargetFormat,
): ConversionType[] {
  return CREATABLE_CONVERSIONS.filter(
    (capability) =>
      capability.sourceFormats.includes(sourceFormat) &&
      capability.targetFormats.includes(targetFormat),
  ).map((capability) => capability.type);
}

export function listTargetFormats(
  sourceFormat: ConversionSourceFormat,
): ConversionTargetFormat[] {
  const formats = new Set<ConversionTargetFormat>();

  for (const capability of CREATABLE_CONVERSIONS) {
    if (capability.sourceFormats.includes(sourceFormat)) {
      for (const format of capability.targetFormats) {
        formats.add(format);
      }
    }
  }

  return [...formats];
}

export function isCreatableConversion(
  sourceFormat: ConversionSourceFormat,
  targetFormat: ConversionTargetFormat,
  type?: ConversionType,
): boolean {
  const types = listCreatableConversionTypes(sourceFormat, targetFormat);

  if (type === undefined) {
    return types.length === 1;
  }

  return types.includes(type);
}

export function resolveCreatableConversionType(
  sourceFormat: ConversionSourceFormat,
  targetFormat: ConversionTargetFormat,
  type?: ConversionType,
): ConversionType | undefined {
  const types = listCreatableConversionTypes(sourceFormat, targetFormat);

  if (type !== undefined) {
    return types.includes(type) ? type : undefined;
  }

  if (types.length === 1) {
    return types[0];
  }

  return undefined;
}
