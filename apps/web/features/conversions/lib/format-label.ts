const FORMAT_KEYS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "jpg",
  "png",
  "txt",
] as const;

export type ConversionFormatLabelKey = (typeof FORMAT_KEYS)[number];

export function isConversionFormatLabelKey(
  value: string,
): value is ConversionFormatLabelKey {
  return FORMAT_KEYS.some((format) => format === value);
}

export function conversionFormatLabel(
  value: string,
  translate: (key: ConversionFormatLabelKey) => string,
): string {
  return isConversionFormatLabelKey(value)
    ? translate(value)
    : value.toUpperCase();
}
