export const TOOL_IDS = [
  "merge-pdf",
  "split-pdf",
  "compress-pdf",
  "repair-pdf",
  "rotate-pdf",
  "organize-pdf",
  "pdf-to-word",
  "pdf-to-excel",
  "pdf-to-powerpoint",
  "pdf-to-jpg",
  "pdf-to-png",
  "pdf-to-txt",
  "word-to-pdf",
  "excel-to-pdf",
  "powerpoint-to-pdf",
  "jpg-to-pdf",
  "png-to-pdf",
  "ocr-pdf",
  "ocr-image",
  "protect-pdf",
  "unlock-pdf",
  "watermark-pdf",
  "page-numbers-pdf",
] as const;

export type ToolId = (typeof TOOL_IDS)[number];

export function isToolId(value: string): value is ToolId {
  return TOOL_IDS.some((id) => id === value);
}
