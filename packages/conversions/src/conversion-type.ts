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
  "watermark-pdf",
  "page-numbers-pdf",
  "protect-pdf",
  "unlock-pdf",
  "ocr-pdf",
  "ocr-image",
] as const;

export type ConversionType = (typeof CONVERSION_TYPES)[number];

export function isConversionType(value: string): value is ConversionType {
  return CONVERSION_TYPES.some((type) => type === value);
}
