import { assertServerOnly } from "@repo/core";

assertServerOnly("@repo/conversions");

export type { ConversionCapability } from "./conversion-capability.js";
export {
  findConversionTypes,
  getConversionCapability,
  isConversionImplemented,
  isConversionSupported,
  isSourceFormatAccepted,
  isTargetFormatAccepted,
  listConversionCapabilities,
} from "./conversion-capability.js";
export type { FileFormat } from "./conversion-format.js";
export {
  FILE_FORMATS,
  isFileFormat,
  normalizeFileFormat,
} from "./conversion-format.js";
export type {
  CompressionLevel,
  CompressPdfOptions,
  ConversionOptions,
  MergePdfOptions,
  OcrOptions,
  OcrOutputMode,
  OfficeConversionOptions,
  ParseConversionOptionsContext,
  PdfPageImageOptions,
  ProtectPdfOptions,
  RotatePdfOptions,
  RotationDegrees,
  SplitPdfOptions,
  UnlockPdfOptions,
} from "./conversion-options.js";
export {
  COMPRESSION_LEVELS,
  OCR_OUTPUT_MODES,
  parseConversionOptions,
  ROTATION_DEGREES,
} from "./conversion-options.js";
export type {
  ConversionRepository,
  ConversionStatusUpdate,
} from "./conversion-repository.js";
export { createConversionRepository } from "./conversion-repository.js";
export type {
  ConversionFileLookup,
  ConversionService,
  ConversionServiceOptions,
} from "./conversion-service.js";
export { createConversionService } from "./conversion-service.js";
export { getConversionService } from "./conversion-service-factory.js";
export type { ConversionStatus } from "./conversion-status.js";
export {
  assertConversionStatusTransition,
  CONVERSION_STATUSES,
  canTransitionConversionStatus,
  isConversionStatus,
} from "./conversion-status.js";
export type { ConversionType } from "./conversion-type.js";
export { CONVERSION_TYPES, isConversionType } from "./conversion-type.js";
export type {
  ConversionFailureCode,
  ConversionRecord,
  CreateConversionInput,
  MarkConversionCompletedInput,
  MarkConversionFailedInput,
} from "./conversion-types.js";
export {
  CONVERSION_FAILURE_CODES,
  isConversionFailureCode,
} from "./conversion-types.js";
export {
  fileFormatFromMimeType,
  isSupportedUploadMimeType,
  listSourceFileFormats,
  listSupportedUploadMimeTypes,
  normalizeContentType,
} from "./file-format-mime.js";
