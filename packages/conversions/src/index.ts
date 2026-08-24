import { assertServerOnly } from "@repo/core";

assertServerOnly("@repo/conversions");

export type { ConversionCapability } from "./conversion-capability.js";
export {
  findConversionTypes,
  findImplementedConversionTypes,
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
  AiSummarizerOptions,
  AiSummarizerOutputMode,
  ComparePdfOptions,
  CompressionLevel,
  CompressPdfOptions,
  ConversionOptions,
  EditPdfOperation,
  EditPdfOptions,
  MergePdfOptions,
  OcrOptions,
  OcrOutputMode,
  OfficeConversionOptions,
  OfficeOcrConversionOptions,
  ParseConversionOptionsContext,
  PdfExtractOptions,
  PdfFormsOptions,
  PdfPageImageOptions,
  PdfToMarkdownOptions,
  PdfToPdfaOptions,
  ProtectPdfOptions,
  RedactPdfOptions,
  RotatePdfOptions,
  RotationDegrees,
  ScanToPdfOptions,
  SignPdfOptions,
  SplitPdfOptions,
  TranslatePdfOptions,
  UnlockPdfOptions,
} from "./conversion-options.js";
export {
  AI_SUMMARIZER_OUTPUT_MODES,
  COMPRESSION_LEVELS,
  OCR_OUTPUT_MODES,
  parseConversionOptions,
  ROTATION_DEGREES,
} from "./conversion-options.js";
export type { ConversionListCursor } from "./conversion-pagination.js";
export {
  assertConversionListLimit,
  decodeConversionListCursor,
  encodeConversionListCursor,
} from "./conversion-pagination.js";
export type {
  ConversionOwnerListInput,
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
  ConversionListQuery,
  ConversionListResult,
  ConversionRecord,
  CreateConversionInput,
  CreateOwnedConversionInput,
  MarkConversionCompletedInput,
  MarkConversionFailedInput,
} from "./conversion-types.js";
export {
  CONVERSION_FAILURE_CODES,
  DEFAULT_CONVERSION_LIST_LIMIT,
  isConversionFailureCode,
  MAX_CONVERSION_LIST_LIMIT,
} from "./conversion-types.js";
export {
  fileFormatFromMimeType,
  isSupportedUploadMimeType,
  listSourceFileFormats,
  listSupportedUploadMimeTypes,
  mimeTypeForFileFormat,
  normalizeContentType,
} from "./file-format-mime.js";
export { resolveImplementedConversionType } from "./resolve-conversion-type.js";
