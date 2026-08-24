export const CONVERSION_STATUSES = [
  "pending",
  "queued",
  "processing",
  "completed",
  "failed",
  "cancelled",
] as const;

export type ConversionStatus = (typeof CONVERSION_STATUSES)[number];

export const CONVERSION_TYPES = [
  "pdf-to-word",
  "pdf-to-word-ocr",
  "pdf-to-excel",
  "pdf-to-excel-ocr",
  "pdf-to-powerpoint",
  "word-to-pdf",
  "excel-to-pdf",
  "powerpoint-to-pdf",
  "office-to-pdf",
  "pdf-to-jpg",
  "pdf-to-png",
  "pdf-to-txt",
  "jpg-to-pdf",
  "png-to-pdf",
  "merge-pdf",
  "split-pdf",
  "compress-pdf",
  "rotate-pdf",
  "organize-pdf",
  "remove-pages",
  "reorder-pages",
  "crop-pdf",
  "repair-pdf",
  "pdf-to-pdfa",
  "watermark-pdf",
  "page-numbers-pdf",
  "edit-pdf",
  "protect-pdf",
  "unlock-pdf",
  "sign-pdf",
  "redact-pdf",
  "compare-pdf",
  "pdf-forms",
  "scan-to-pdf",
  "pdf-extract",
  "pdf-to-markdown",
  "ocr-pdf",
  "ocr-image",
  "ai-summarizer",
  "translate-pdf",
] as const;

export type ConversionType = (typeof CONVERSION_TYPES)[number];

export const CONVERSION_SOURCE_FORMATS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "jpg",
  "png",
] as const;

export type ConversionSourceFormat = (typeof CONVERSION_SOURCE_FORMATS)[number];

export const CONVERSION_TARGET_FORMATS = [
  "pdf",
  "docx",
  "xlsx",
  "pptx",
  "jpg",
  "png",
  "txt",
  "md",
  "json",
] as const;

export type ConversionTargetFormat = (typeof CONVERSION_TARGET_FORMATS)[number];

export type PublicConversionError = {
  code: string;
  message: string;
};

export type PublicConversion = {
  id: string;
  status: ConversionStatus;
  sourceFileId: string;
  sourceFilename: string | null;
  outputFileId: string | null;
  type: ConversionType;
  sourceFormat: string;
  targetFormat: string;
  createdAt: string;
  updatedAt: string;
  queuedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
  expired: boolean;
  error?: PublicConversionError;
};

export type CreateConversionInput = {
  sourceFileId: string;
  targetFormat: string;
  type?: ConversionType;
  additionalFileIds?: string[];
  options?: Record<string, unknown>;
  idempotencyKey?: string;
};

export type CreateConversionResponse = {
  conversion: PublicConversion;
};

export type GetConversionResponse = {
  conversion: PublicConversion;
};

export type ConversionListQuery = {
  cursor?: string;
  limit?: number;
  status?: ConversionStatus;
};

export type ConversionListResponse = {
  conversions: PublicConversion[];
  nextCursor: string | null;
};
